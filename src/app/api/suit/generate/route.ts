import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import sharp from 'sharp'

// Allow up to 60s for Vertex AI Imagen
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
)

const GOOGLE_PROJECT  = 'suit1-492705'
const GOOGLE_LOCATION = 'us-central1'
const IMAGEN_MODEL    = 'imagen-3.0-capability-001'
const TARGET          = 1024

// ─── Google auth ─────────────────────────────────────────────────────────────

function getGoogleCreds() {
  const b64 = (process.env.GOOGLE_CREDS_B64 || '').trim()
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))
}

function makeJWT(creds: { client_email: string; private_key: string }) {
  const now     = Math.floor(Date.now() / 1000)
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss:   creds.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  })).toString('base64url')
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const sig = sign.sign(creds.private_key, 'base64url')
  return `${header}.${payload}.${sig}`
}

async function getAccessToken(): Promise<string> {
  const creds = getGoogleCreds()
  const jwt   = makeJWT(creds)
  const res   = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Google auth failed: ${JSON.stringify(data)}`)
  return data.access_token
}

// ─── Face detection via Google Vision API ────────────────────────────────────

type FaceBox = { x: number; y: number; w: number; h: number }

async function detectFace(imageBase64: string, token: string): Promise<FaceBox | null> {
  try {
    const res  = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        requests: [{
          image:    { content: imageBase64 },
          features: [{ type: 'FACE_DETECTION', maxResults: 1 }],
        }],
      }),
    })
    const data = await res.json()
    const face = data?.responses?.[0]?.faceAnnotations?.[0]
    if (!face) { console.log('[Vision] No face detected'); return null }

    // fdBoundingPoly = tighter fit around face features
    const poly = face.fdBoundingPoly?.vertices || face.boundingPoly?.vertices
    if (!poly || poly.length < 4) return null

    const xs = poly.map((v: { x?: number }) => v.x || 0)
    const ys = poly.map((v: { y?: number }) => v.y || 0)
    const x  = Math.min(...xs)
    const y  = Math.min(...ys)
    const w  = Math.max(...xs) - x
    const h  = Math.max(...ys) - y

    console.log(`[Vision] Face: x=${x} y=${y} w=${w} h=${h}`)
    return { x, y, w, h }
  } catch (e) {
    console.error('[Vision] Error:', e)
    return null
  }
}

// ─── Mouth-center crop + v120 mask ───────────────────────────────────────────
// Mirrors bot v147: create_body_mask (v118 crop + v120 ellipse)

async function prepareImageAndMask(
  imageBytes: Buffer,
  face: FaceBox | null,
): Promise<{ img: Buffer; mask: Buffer }> {
  let resizedImg: Buffer
  let ellipse: { cx: number; cy: number; rx: number; ry: number }

  if (face) {
    const { x: fx, y: fy, w: fw, h: fh } = face

    // v118: mouth-center crop
    // mouth ≈ 80% ลงมาจากบนหน้า
    const mouthCx = Math.round(fx + fw / 2)
    const mouthCy = Math.round(fy + fh * 0.8)
    const half    = Math.round(fh * 1.5)   // รัศมีครอบหัว+ไหล่

    const meta  = await sharp(imageBytes).metadata()
    const origW = meta.width!
    const origH = meta.height!

    // crop bounds (with white padding ถ้าหลุดขอบ)
    const cropL = mouthCx - half
    const cropT = mouthCy - half
    const cropSize = half * 2

    const srcL = Math.max(0, cropL)
    const srcT = Math.max(0, cropT)
    const srcR = Math.min(origW, cropL + cropSize)
    const srcB = Math.min(origH, cropT + cropSize)

    const padL = Math.max(0, -cropL)
    const padT = Math.max(0, -cropT)
    const padR = Math.max(0, cropL + cropSize - origW)
    const padB = Math.max(0, cropT + cropSize - origH)

    resizedImg = await sharp(imageBytes)
      .extract({ left: srcL, top: srcT, width: srcR - srcL, height: srcB - srcT })
      .extend({ left: padL, top: padT, right: padR, bottom: padB,
                background: { r: 255, g: 255, b: 255 } })
      .resize(TARGET, TARGET, { fit: 'fill' })
      .png()
      .toBuffer()

    // v120: compute face position in 1024×1024
    const scale  = TARGET / cropSize
    const sFx    = (fx - cropL + padL) * scale
    const sFy    = (fy - cropT + padT) * scale
    const sFw    = fw * scale
    const sFh    = fh * scale

    // Ellipse: ดำครอบแค่ใบหน้า+หัว หยุดที่คาง (fy+fh)
    const protX1 = Math.max(0,      sFx - sFw * 0.55)
    const protY1 = Math.max(0,      sFy - sFh * 0.75)
    const protX2 = Math.min(TARGET, sFx + sFw + sFw * 0.55)
    const protY2 = Math.min(TARGET, sFy + sFh) // chin = fy + fh

    ellipse = {
      cx: (protX1 + protX2) / 2,
      cy: (protY1 + protY2) / 2,
      rx: (protX2 - protX1) / 2,
      ry: (protY2 - protY1) / 2,
    }
    console.log(`[Mask] v120 face ellipse: cx=${ellipse.cx.toFixed(0)} cy=${ellipse.cy.toFixed(0)} rx=${ellipse.rx.toFixed(0)} ry=${ellipse.ry.toFixed(0)} (chin-stop)`)

  } else {
    // Fallback: square pad (v111 fallback)
    resizedImg = await sharp(imageBytes)
      .resize(TARGET, TARGET, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .png()
      .toBuffer()

    // Fallback ellipse: top 38%, ±35% width
    const faceBottom = TARGET * 0.38
    ellipse = {
      cx: TARGET / 2,
      cy: faceBottom / 2,
      rx: TARGET * 0.35,
      ry: faceBottom / 2,
    }
    console.log('[Mask] Fallback ellipse (no face detected, top 38%)')
  }

  // Build raw grayscale mask: white=replace, black=protect face
  const rawMask = Buffer.alloc(TARGET * TARGET, 255)
  const { cx, cy, rx, ry } = ellipse
  for (let y = 0; y < TARGET; y++) {
    for (let x = 0; x < TARGET; x++) {
      const dy = (y - cy) / ry
      const dx = (x - cx) / rx
      if (dx * dx + dy * dy <= 1.0) rawMask[y * TARGET + x] = 0
    }
  }

  // GaussianBlur radius=5 (v120: ลด halo)
  const mask = await sharp(rawMask, { raw: { width: TARGET, height: TARGET, channels: 1 } })
    .blur(5)
    .png()
    .toBuffer()

  return { img: resizedImg, mask }
}

// ─── Vertex AI Imagen inpainting (v119 prompts + v119 params) ────────────────

async function callImagenInpainting(
  photoBase64: string,
  maskBase64:  string,
  gender:      string,
  token:       string,
): Promise<string> {
  const isFemale = gender === 'หญิง'
  const prompt   = isFemale
    ? 'Professional corporate ID photo of a woman. She is wearing a dark navy blue blazer suit jacket with sharp notch lapels, white collared dress shirt underneath fully buttoned. Solid pure white background, soft studio lighting from front, sharp focus on face and suit, photorealistic, high resolution. Must have visible suit lapels and white shirt collar. No t-shirt, no round collar, no collarless top, no casual clothing.'
    : 'Professional corporate ID photo of a man. He is wearing a dark navy blue business suit jacket with wide notch lapels, crisp white collared dress shirt underneath, dark navy necktie with a windsor knot centered on the chest. Solid pure white background, soft studio lighting from front, sharp focus on face and suit, photorealistic, high resolution. Must have visible suit lapels, white shirt collar, and necktie. No t-shirt, no round collar, no collarless top, no casual clothing, no missing tie.'

  const endpoint = `https://${GOOGLE_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_PROJECT}/locations/${GOOGLE_LOCATION}/publishers/google/models/${IMAGEN_MODEL}:predict`

  const body = {
    instances: [{
      prompt,
      referenceImages: [
        {
          referenceType:  'REFERENCE_TYPE_RAW',
          referenceId:    1,
          referenceImage: { bytesBase64Encoded: photoBase64 },
        },
        {
          referenceType:  'REFERENCE_TYPE_MASK',
          referenceId:    2,
          referenceImage: { bytesBase64Encoded: maskBase64 },
          maskImageConfig: {
            maskMode: 'MASK_MODE_USER_PROVIDED',
            dilation: 0.01,   // v147: smoother mask edge
          },
        },
      ],
    }],
    parameters: {
      sampleCount:      1,
      editConfig:       { editMode: 'EDIT_MODE_INPAINT_INSERTION' },
      guidanceScale:    60,
      personGeneration: 'allow_all',
      safetySetting:    'block_some',
    },
  }

  const res  = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  console.log('[Imagen] status:', res.status)

  const b64 = data?.predictions?.[0]?.bytesBase64Encoded
  if (!b64) throw new Error(`Imagen returned no image: ${JSON.stringify(data).slice(0, 400)}`)
  return b64
}

// ─── Upload to Supabase Storage ───────────────────────────────────────────────

async function uploadToStorage(bucket: string, path: string, buffer: Buffer, mime = 'image/png') {
  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
    contentType: mime,
    upsert:      true,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let resume_id = ''
  try {
    const body = await req.json()
    resume_id = body.resume_id || ''
    if (!resume_id) return Response.json({ error: 'Missing resume_id' }, { status: 400 })

    const { data: resume, error: rErr } = await supabase
      .from('resumes')
      .select('id, photo_url, gender, suit_status')
      .eq('id', resume_id)
      .single()

    if (rErr || !resume) return Response.json({ error: 'Resume not found' }, { status: 404 })
    if (!resume.photo_url)  return Response.json({ error: 'No photo uploaded' }, { status: 400 })

    await supabase.from('resumes').update({ suit_status: 'processing' }).eq('id', resume_id)

    // 1) Download photo
    console.log('[Suit] Downloading photo:', resume.photo_url)
    const photoRes = await fetch(resume.photo_url)
    const photoBuf = Buffer.from(await photoRes.arrayBuffer())

    // 2) Single Google access token (reused for Vision + Imagen)
    const token = await getAccessToken()

    // 3) Face detection via Google Vision API
    const photoB64orig = photoBuf.toString('base64')
    const face = await detectFace(photoB64orig, token)

    // 4) Mouth-center crop (v118) + v120 mask
    console.log('[Suit] Preparing image + mask...')
    const { img: processedImg, mask } = await prepareImageAndMask(photoBuf, face)
    const photoB64 = processedImg.toString('base64')
    const maskB64  = mask.toString('base64')

    // 5) Call Vertex AI Imagen
    console.log('[Suit] Calling Imagen inpainting...')
    const suitB64 = await callImagenInpainting(photoB64, maskB64, resume.gender || 'ชาย', token)
    const suitBuf = Buffer.from(suitB64, 'base64')

    // 6) Upload
    const suitPath = `suits/${resume_id}.png`
    const suitUrl  = await uploadToStorage('resume-files', suitPath, suitBuf)
    console.log('[Suit] Uploaded:', suitUrl)

    // 7) Update DB
    await supabase.from('resumes').update({
      suit_photo_url: suitUrl,
      suit_status:    'done',
    }).eq('id', resume_id)

    return Response.json({ suit_photo_url: suitUrl })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[Suit] ERROR:', msg)
    if (resume_id) {
      await supabase.from('resumes').update({ suit_status: 'error' }).eq('id', resume_id)
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}
