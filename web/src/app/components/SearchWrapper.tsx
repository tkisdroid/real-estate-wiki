"use client";

import dynamic from "next/dynamic";

const SearchFilter = dynamic(() => import("./SearchFilter"), { ssr: false });

export default function SearchWrapper({ basePath }: { basePath: string }) {
  return <SearchFilter basePath={basePath} />;
}
