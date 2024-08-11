import React from "react";
import type { ReactNode } from "react";
import SwrInitor from "@/app/components/swr-initor";
import { AppContextProvider } from "@/context/app-context";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <SwrInitor>
        <AppContextProvider>{children}</AppContextProvider>
      </SwrInitor>
    </>
  );
};

export const metadata = {
  title: "Dify",
};

export default Layout;
