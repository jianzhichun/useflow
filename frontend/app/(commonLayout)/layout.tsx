import React from "react";
import type { ReactNode } from "react";
import { EventEmitterContextProvider } from "@/context/event-emitter";
import SwrInitor from "@/app/components/swr-initor";
import { AppContextProvider } from "@/context/app-context";
import HeaderWrapper from "@/app/components/header/header-wrapper";
import Header from "@/app/components/header";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <SwrInitor>
        <AppContextProvider>
          <EventEmitterContextProvider>
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            {children}
          </EventEmitterContextProvider>
        </AppContextProvider>
      </SwrInitor>
    </>
  );
};

export const metadata = {
  title: "Motion Capture",
};

export default Layout;
