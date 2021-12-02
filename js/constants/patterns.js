const SKIP = /^\s*$/;
const LABEL = /^\s*([\p{L}_][\p{L}\p{N}_]*):\s*$/u;
const INSTR = /^\s*([a-z.]+)\s/;
const REG = /\$([0-9A-Za-z]+)/g;
const NUM = /(?:\s|,)(-?\d+)/;
const LBL = /(?:\s|,)([\p{L}_][\p{L}\p{N}]*)(?:\s*)(?:,|$)/u;
export { SKIP, LABEL, INSTR, REG, NUM, LBL };
