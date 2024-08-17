import dynamic from 'next/dynamic';

const TellAPhoneApp = dynamic(() => import('../components/TellAPhoneApp'), { 
  ssr: false 
});

export default function Home() {
  return (
    <main>
      <TellAPhoneApp />
    </main>
  );
}