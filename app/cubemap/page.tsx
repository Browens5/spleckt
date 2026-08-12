import type { Metadata } from "next";
import { CubemapTool } from "@/components/cubemap/CubemapTool";

export const metadata: Metadata = {
  title: {
    absolute: "Cubemap — Equirect 360 to cube faces",
  },
};

export default function CubemapHomePage() {
  return <CubemapTool />;
}
