import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: 'linear-gradient(to bottom, #475569, #334155)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f59e0b',
          fontWeight: 800,
          fontFamily: 'monospace',
          borderRadius: '50%',
        }}
      >
        <span style={{ transform: 'skewX(-12deg)' }}>I</span>
      </div>
    ),
    {
      ...size,
    }
  )
}
