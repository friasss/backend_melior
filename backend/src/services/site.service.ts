import * as fs from "fs";
import * as path from "path";

const FOUNDERS_PATH = path.join(__dirname, "../data/founders.json");

export interface Founder {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
}

function readFounders(): Founder[] {
  try {
    return JSON.parse(fs.readFileSync(FOUNDERS_PATH, "utf8")) as Founder[];
  } catch {
    return [];
  }
}

function writeFounders(founders: Founder[]) {
  fs.writeFileSync(FOUNDERS_PATH, JSON.stringify(founders, null, 2), "utf8");
}

export class SiteService {
  getFounders(): Founder[] {
    return readFounders();
  }

  updateFounder(id: string, patch: Partial<Pick<Founder, "name" | "role" | "bio" | "photo">>): Founder {
    const founders = readFounders();
    const idx = founders.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error("Fundador no encontrado");
    founders[idx] = { ...founders[idx], ...patch };
    writeFounders(founders);
    return founders[idx];
  }
}

export const siteService = new SiteService();
