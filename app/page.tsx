import { Metadata } from "next";
import HomePage from "./pages/home";

export const metadata: Metadata = {
  title: 'Dashboard - JamboLush',
  description: 'Dashboard for your JamboLush account'
}

export default function Home() {
    const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("userSession") || '{}') : null;
    if (userData && userData.role)
               window.location.href = `/all/${userData.role}`;
  return (
    <HomePage />
  );
}
