
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard - JamboLush',
  description: 'Dashboard for your JamboLush account'
}

export default function Home() {
    const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("userSession") || '{}') : null;
    if (userData && userData.role)
               window.location.href = `/all/${userData.role}`;
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      Welcome to the JamboLush Dashboard!
    </div>
  );
}
