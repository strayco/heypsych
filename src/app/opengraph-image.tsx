import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'HeyPsych - Mental Health Education & Resources';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
          }}
        />

        {/* Content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo - using the H mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '200px',
              height: '200px',
              borderRadius: '24px',
              backgroundColor: '#4f46e5',
              boxShadow: '0 10px 40px rgba(79, 70, 229, 0.3)',
            }}
          >
            <div
              style={{
                fontSize: '120px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.05em',
              }}
            >
              H
            </div>
          </div>

          {/* Site name */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontSize: '72px',
                fontWeight: 700,
                color: '#1e293b',
                letterSpacing: '-0.03em',
              }}
            >
              HeyPsych
            </div>
            <div
              style={{
                fontSize: '32px',
                color: '#64748b',
                textAlign: 'center',
                maxWidth: '900px',
              }}
            >
              Mental Health Education & Resources
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
