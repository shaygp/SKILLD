import { Buffer } from 'buffer';
import process from 'process';

const g = globalThis as unknown as { Buffer?: typeof Buffer; global?: typeof globalThis; process?: typeof process };
if (!g.Buffer) g.Buffer = Buffer;
if (!g.global) g.global = globalThis;
if (!g.process) g.process = process;
