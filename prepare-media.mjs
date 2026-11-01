import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";
const dir = "assets/Main_Comp 3";
const entries = [
  ["Arun Sundar Ravichandran_Capstone.gif", "Capstone", "motion"],
  ["Arun_Assign.gif", "Motion Study", "motion"],
  ["Arun_Bik_Assignment.gif", "Bik", "motion"],
  ["Character_Animation.gif", "Character", "experimental"],
  ["Comp 1 (1).gif", "Composition 01", "experimental"],
  ["Comp 1.gif", "Composition 02", "motion"],
  ["Game_Interface.gif", "Game Interface", "experimental"],
  ["Main_Comp 3.gif", "Main Composition", "motion"],
  ["Master_Comp_Retail.gif", "Retail", "brand"],
  ["Neeman_Shoe.gif", "Neeman Shoe", "brand"],
  ["Newton.gif", "Newton", "motion"],
  ["Sniffr_AI_V2_lanpage.gif", "Sniffr AI", "brand"],
];
fs.mkdirSync("public/media", { recursive: true });
const projects = [];
for (let i = 0; i < entries.length; i++) {
  const [file, name, type] = entries[i];
  const prefix = `/media/project-${i + 1}`;
  const input = path.join(dir, file);
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      input,
      "-frames:v",
      "1",
      "-vf",
      "scale=800:-2",
      "-update",
      "1",
      `public${prefix}.webp`,
    ],
    { stdio: "ignore" },
  );
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      input,
      "-an",
      "-vf",
      "scale=800:-2,fps=24",
      "-c:v",
      "libx264",
      "-crf",
      "26",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      `public${prefix}.mp4`,
    ],
    { stdio: "ignore" },
  );
  projects.push({
    name,
    type,
    label: {
      motion: "Motion Design",
      brand: "Brand Motion",
      experimental: "Visual Experiment",
      "3d": "3D / VFX",
    }[type],
    a: "#101b32",
    b: "#253459",
    c: "#ffcf35",
    glow: "#376df2",
    copy: name,
    poster: prefix + ".webp",
    video: prefix + ".mp4",
  });
  console.log(`Prepared ${i + 1}/12: ${name}`);
}
const existing = fs
  .readFileSync("src/projects.ts", "utf8")
  .split("export const projects:")[0];
fs.writeFileSync(
  "src/projects.ts",
  existing +
    "export const projects: Project[] = " +
    JSON.stringify(projects, null, 2) +
    ";\n",
);
