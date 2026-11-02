import type { Metadata } from "next";
import TekadGame from "../tekad-game";

export const metadata: Metadata = {
  title: "TEKAD Switch Run · Earth 3000",
  description: "Endless platformer 16-bit bersama lima karakter TEKAD di Earth 3000.",
};

export default function SwitchRunPage() {
  return <TekadGame />;
}
