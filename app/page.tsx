import { Metadata } from "next";
import HomePage from "./pages/home";

export const metadata: Metadata = {
  title: 'Dashboard - JamboLush',
  description: 'Dashboard for your JamboLush account'
}

export default function Home() {
  return (
    <HomePage />
  );
}
