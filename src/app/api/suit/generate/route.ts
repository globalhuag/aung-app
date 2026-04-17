import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import sharp from 'sharp'

// Allow up to 60s for Vertex AI Imagen (takes ~20-30s)
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const GOOGLE_PROJECT  = 'suit1-492705'
const GOOGLE_LOCATION = 'us-central1'
const IMAGEN_MODEL    = 'imagen-3.0-capability-001'

// ─── Google auth ─────────────────────────────────────────────────────────────

function getGoogleCreds() {
  const b64 = (process.env.GOOGLE_CREDS_B64 || '').trim()
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))
}

function makeJWT(creds: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000)
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud:  'https://oauth2.googleapis.com/token',
    iat:  now,
    exp:  now + 3600,
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

// ─── Mask creation (mirrors bot v147 create_body_mask) ────────────────────────
// NOTE: Uses raw pixel buffer instead of SVG to avoid librsvg dependency on Vercel Linux

async function createBodyMask(imageBytes: Buffer): Promise<{ img: Buffer; mask: Buffer; w: number; h: number }> {
  const TARGET = 1024

  // Resize to 1024×1024 (square pad with white)
  const img = await sharp(imageBytes)
    .resize(TARGET, TARGET, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer()

  const w = TARGET, h = TARGET

  // Face protection oval parameters (same as bot v147)
  const faceCx = w / 2
  const faceCy = h * 0.25
  const faceRx = w * 0.25
  const faceRy = h * 0.28

  // Build raw grayscale mask pixel-by-pixel (no SVG / no librsvg needed)
  // White (255) = replace (body + background), Black (0) = protect (face oval)
  const rawMask = Buffer.alloc(w * h, 255)  // start all-white
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dy = (y - faceCy) / faceRy
      const dx = (x - faceCx) / faceRx
      if (dx * dx + dy * dy <= 1.0) {
        rawMask[y * w + x] = 0  // black = protect face
      }
    }
  }

  // Convert raw grayscale → PNG, then apply soft blur for smooth edges
  const mask = await sharp(rawMask, {
    raw: { width: w, height: h, channels: 1 },
  })
    .blur(8)
    .png()
    .toBuffer()

  return { img, mask, w, h }
}

// ─── Vertex AI Imagen inpainting ─────────────────────────────────────────────

async function callImagenInpainting(
  photoBase64: string,
  maskBase64:  string,
  gender:      string,
): Promise<string> {
  const isFemale = gender === 'หญิง'
  const prompt   = isFemale
    ? 'Professional corporate ID photo of a woman. She is wearing a dark navy blue blazer suit jacket with sharp notch lapels, white collared shirt underneath. Solid pure white background, soft studio lighting from front, sharp focus on face and suit, photorealistic, high resolution. Must have visible suit lapels and white shirt collar.'
    : 'Professional corporate ID photo of a man. He is wearing a dark navy blue business suit jacket with wide notch lapels, white dress shirt, dark blue necktie. Solid pure white background, soft studio lighting from front, sharp focus on face and suit, photorealistic, high resolution. Must have visible suit lapels, white shirt collar, and necktie.'

  const endpoint = `https://${GOOGLE_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_PROJECT}/locations/${GOOGLE_LOCATION}/publishers/google/models/${IMAGEN_MODEL}:predict`
  const token    = await getAccessToken()

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
          },
        },
      ],
    }],
    parameters: {
      sampleCount: 1,
      editConfig:  { editMode: 'EDIT_MODE_INPAINT_INSERTION' },
    },
  }

  const res  = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  console.log('[Imagen] response status:', res.status)

  const b64 = data?.predictions?.[0]?.bytesBase64Encoded
  if (!b64) throw new Error(`Imagen returned no image: ${JSON.stringify(data).slice(0, 300)}`)
  return b64
}

// ─── Upload to Supabase Storage ────────────────────────────────────────────────

async function uploadToStorage(bucket: string, path: string, buffer: Buffer, mime = 'image/png') {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: mime,
    upsert:      true,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let resume_id = ''
  try {
    const body = await req.json()
    resume_id = body.resume_id || ''
    if (!resume_id) return Response.json({ error: 'Missing resume_id' }, { status: 400 })

    // 1) Load resume
    const { data: resume, error: rErr } = await supabase
      .from('resumes')
      .select('id, photo_url, gender, suit_status')
      .eq('id', resume_id)
      .single()

    if (rErr || !resume) return Response.json({ error: 'Resume not found' }, { status: 404 })
    if (!resume.photo_url) return Response.json({ error: 'No photo uploaded' }, { status: 400 })

    // Mark as processing
    await supabase.from('resumes').update({ suit_status: 'processing' }).eq('id', resume_id)

    // 2) Download original photo
    console.log('[Suit] Downloading photo:', resume.photo_url)
    const photoRes  = await fetch(resume.photo_url)
    const photoBuf  = Buffer.from(await photoRes.arrayBuffer())

    // 3) Create mask
    const { img: resizedImg, mask } = await createBodyMask(photoBuf)
    const photoB64 = resizedImg.toString('base64')
    const maskB64  = mask.toString('base64')

    // 4) Call Vertex AI Imagen
    console.log('[Suit] Calling Imagen inpainting...')
    const suitB64 = await callImagenInpainting(photoB64, maskB64, resume.gender || 'ชาย')
    const suitBuf = Buffer.from(suitB64, 'base64')

    // 5) Upload suit photo to Supabase Storage
    const suitPath = `suits/${resume_id}.png`
    const suitUrl  = await uploadToStorage('resume-files', suitPath, suitBuf)
    console.log('[Suit] Uploaded:', suitUrl)

    // 6) Update DB
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
