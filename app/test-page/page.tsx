export default function TestPage() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
      <h1>TEST PAGE WORKING!</h1>
      <p>If you can see this, Next.js is working</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  )
} 