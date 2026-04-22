import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

// Verify a LIFF idToken against LINE's servers, then upsert a matching users row.
// LINE's verify endpoint validates the JWT signature AND checks that it was issued
// for *our* channel (client_id). We never trust the userId/name/picture sent by the
// client directly — only the fields returned by this verify call.
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json()
    if (typeof idToken !== 'string' || !idToken) {
      return Response.json({ error: 'idToken required' }, { status: 400 })
    }

    const channelId = process.env.LINE_LOGIN_CHANNEL_ID
    if (!channelId) {
      console.error('[auth/line] LINE_LOGIN_CHANNEL_ID not set')
      return Response.json({ error: 'server misconfigured' }, { status: 500 })
    }

    // https://developers.line.biz/en/reference/line-login/#verify-id-token
    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
    })
    if (!verifyRes.ok) {
      const txt = await verifyRes.text()
      console.error('[auth/line] verify failed:', verifyRes.status, txt)
      return Response.json({ error: 'LINE verify failed' }, { status: 401 })
    }
    const claims = await verifyRes.json() as {
      sub: string // LINE user ID (Uxxxx…)
      name?: string
      picture?: string
      aud: string
      iss: string
      exp: number
    }

    const lineUserId = claims.sub
    const displayName = claims.name ?? null
    const pictureUrl = claims.picture ?? null

    // Upsert by line_user_id. If already linked (existing user returning), update
    // display_name/picture so profile photo changes reflect on next login.
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('line_user_id', lineUserId)
      .maybeSingle()

    if (existing) {
      const { data: updated, error } = await supabase
        .from('users')
        .update({ display_name: displayName, picture_url: pictureUrl })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) {
        console.error('[auth/line] update error:', error.message)
        return Response.json({ error: 'update failed' }, { status: 500 })
      }
      return Response.json({ ok: true, user: updated })
    }

    const { data: created, error: insErr } = await supabase
      .from('users')
      .insert({
        line_user_id: lineUserId,
        display_name: displayName,
        picture_url: pictureUrl,
        credits: 1,
      })
      .select()
      .single()
    if (insErr || !created) {
      console.error('[auth/line] insert error:', insErr?.message)
      return Response.json({ error: 'create failed' }, { status: 500 })
    }
    return Response.json({ ok: true, user: created })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[auth/line] error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
