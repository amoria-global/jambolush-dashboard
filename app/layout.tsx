
import SideBar from "./components/sidebar";
import TopBar from "./components/topbar";
import "./styles/globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className="">
        <SideBar />
        <TopBar />
        <main className={`md:ml-72 p-4 sm:p-2 md:p-4 `}>
          {children}
        </main>
      </body>
    </html>
  );
}
