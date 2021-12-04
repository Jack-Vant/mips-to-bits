import * as PATTERNS from "./constants/patterns.js";
import * as FIELD_SIZES from "./constants/field_sizes.js";
import { REGISTERS } from "./constants/registers.js";
class Ins {
    constructor(syntax, op_or_func) {
        this.syntax = syntax;
        this.op_or_func = op_or_func;
    }
}
class Unsolved extends Ins {
    constructor(syntax, op_or_func, args, _ic) {
        super(syntax, op_or_func);
        this.args = args;
        this.ic = _ic;
    }
}
let ic;
let unsolved_list;
let labels;
let punch;
function _toMachineCode(values, sizes) {
    let base10_mc = values[0];
    const len = sizes.length;
    for (let i = 0; i < len; i++)
        base10_mc = ((base10_mc << sizes[i]) | values[i + 1]);
    return punch(base10_mc);
}
function _regOrErr(s) {
    const _s = s.substring(1).toLowerCase();
    let r = REGISTERS?.[_s];
    if (r != undefined)
        return r;
    r = Number.parseInt(_s);
    if (0 < r && r < 32)
        return r;
    throw Error(`Bad register "${s}"`);
}
function _getReg(args) {
    const match = args.match(PATTERNS.REG);
    if (match == null)
        throw Error("Missing register parameter");
    return _regOrErr(match[1]);
}
function _getRegList(args, len) {
    const matches = args.match(PATTERNS.REG);
    if (matches == null || matches.length < len)
        throw Error("Missing register parameter(s)");
    return matches.map(_regOrErr);
}
function _getNum(args) {
    const match = PATTERNS.NUM.exec(args)?.[1];
    if (match)
        return Number(match);
    else
        throw Error("Missing numeric parameter");
}
function _getAddr(args) {
    const lbl = PATTERNS.LBL.exec(args)?.[1];
    if (lbl == undefined)
        throw Error("Missing label param");
    const addr = labels[lbl];
    return addr;
}
function _getAddrOrPush(op, args, s) {
    const addr = _getAddr(args);
    if (addr == undefined)
        unsolved_list.push(new Unsolved(s, op, args, ic));
    return addr;
}
function func(func) {
    return _toMachineCode([func], []);
}
function arithLog(func, args) {
    const regs = _getRegList(args, 3);
    return _toMachineCode([regs[1], regs[2], regs[0], 0, func], FIELD_SIZES.R);
}
function divMult(func, args) {
    const regs = _getRegList(args, 2);
    return _toMachineCode([regs[1], regs[0], 0, 0, func], FIELD_SIZES.R);
}
function shift(func, args) {
    const regs = _getRegList(args, 2);
    return _toMachineCode([0, regs[1], regs[0], _getNum(args), func], FIELD_SIZES.R);
}
function shiftV(func, args) {
    const regs = _getRegList(args, 3);
    return _toMachineCode([regs[2], regs[1], regs[0], 0, func], FIELD_SIZES.R);
}
function jumpR(func, args) {
    return _toMachineCode([_getReg(args), 0, 0, 0, func], FIELD_SIZES.R);
}
function moveFrom(func, args) {
    return _toMachineCode([0, 0, _getReg(args), 0, func], FIELD_SIZES.R);
}
function arithLogI(op, args) {
    const regs = _getRegList(args, 2);
    return _toMachineCode([op, regs[1], regs[0], _getNum(args)], FIELD_SIZES.I);
}
function loadI(op, args) {
    return _toMachineCode([op, 0, _getReg(args), _getNum(args)], FIELD_SIZES.I);
}
function branch(op, args) {
    const addr = _getAddrOrPush(op, args, branch);
    if (addr == undefined)
        return "unsolved";
    const regs = _getRegList(args, 2);
    return _toMachineCode([op, regs[0], regs[1], (addr - ic) & 0xFFFF], FIELD_SIZES.I);
}
function branchZ(op, args) {
    const addr = _getAddrOrPush(op, args, branchZ);
    if (addr == undefined)
        return "unsolved";
    return _toMachineCode([op, _getReg(args), 0, (addr - ic) & 0xFFFF], FIELD_SIZES.I);
}
function loadStore(op, args) {
    const regs = _getRegList(args, 2);
    return _toMachineCode([op, regs[1], regs[0], _getNum(args)], FIELD_SIZES.I);
}
function jump(op, args) {
    const addr = _getAddrOrPush(op, args, jump);
    if (addr == undefined)
        return "unsolved";
    return _toMachineCode([op, addr], FIELD_SIZES.J);
}
function trap(op, args) {
    return _toMachineCode([op, _getNum(args)], FIELD_SIZES.J);
}
const INSTRUCTIONS = {
    // Arithmetic and Logical Instructions
    "add": new Ins(arithLog, 32),
    "addu": new Ins(arithLog, 33),
    "addi": new Ins(arithLogI, 8),
    "addiu": new Ins(arithLogI, 9),
    "and": new Ins(arithLog, 36),
    "andi": new Ins(arithLogI, 12),
    "div": new Ins(divMult, 26),
    "divu": new Ins(divMult, 27),
    "mult": new Ins(divMult, 24),
    "multu": new Ins(divMult, 25),
    "nor": new Ins(arithLog, 39),
    "or": new Ins(arithLog, 37),
    "ori": new Ins(arithLogI, 13),
    "sll": new Ins(shift, 0),
    "sllv": new Ins(shiftV, 4),
    "sra": new Ins(shift, 3),
    "srav": new Ins(shiftV, 7),
    "srl": new Ins(shift, 2),
    "srlv": new Ins(shiftV, 6),
    "sub": new Ins(arithLog, 34),
    "subu": new Ins(arithLog, 35),
    "xor": new Ins(arithLog, 38),
    "xori": new Ins(arithLogI, 14),
    // Constant-Manipulating Instructions
    "lhi": new Ins(loadI, 25),
    "llo": new Ins(loadI, 24),
    // Comparison Instructions
    "slt": new Ins(arithLog, 42),
    "sltu": new Ins(arithLog, 41),
    "slti": new Ins(arithLogI, 10),
    "sltiu": new Ins(arithLogI, 9),
    // Branch Instructions
    "beq": new Ins(branch, 4),
    "bgtz": new Ins(branchZ, 7),
    "blez": new Ins(branchZ, 6),
    "bne": new Ins(branch, 5),
    // Jump Instructions
    "j": new Ins(jump, 2),
    "jal": new Ins(jump, 3),
    "jalr": new Ins(jumpR, 9),
    "jr": new Ins(jumpR, 8),
    // Load Instructions
    "lb": new Ins(loadStore, 32),
    "lbu": new Ins(loadStore, 36),
    "lh": new Ins(loadStore, 33),
    "lhu": new Ins(loadStore, 37),
    "lw": new Ins(loadStore, 35),
    // Store Instructions
    "sb": new Ins(loadStore, 40),
    "sh": new Ins(loadStore, 41),
    "sw": new Ins(loadStore, 43),
    // Data Movement Instructions
    "mfhi": new Ins(moveFrom, 16),
    "mflo": new Ins(moveFrom, 18),
    "mthi": new Ins(jumpR, 17),
    "mtlo": new Ins(jumpR, 19),
    // Exception and Interrupt Instructions
    "trap": new Ins(trap, 26),
    // Syscall
    "syscall": new Ins(func, 12),
};
function convert(srcName, srcText, size, allowPartial = false) {
    ic = 0;
    labels = {};
    unsolved_list = [];
    const errorList = [];
    const outLines = [];
    punch = size == 32 ? (n) => n.toString(2).padStart(32, "0") + "\n" : (n) => n.toString(16).padStart(8, "0") + "\n";
    let i_src = 0;
    const lines = srcText.split(/\r?\n/);
    for (const line of lines) {
        i_src++;
        const args = line.split("#", 1)[0];
        if (PATTERNS.SKIP.test(args))
            continue;
        const lbl = PATTERNS.LABEL.exec(args)?.[1];
        if (lbl) {
            if (labels[lbl] != undefined)
                throw Error(`Duplicate label "${lbl}"`);
            labels[lbl] = ic - 1;
            continue;
        }
        const name = PATTERNS.INSTR.exec(args)?.[1]?.toLowerCase();
        try {
            if (name) {
                const ins = INSTRUCTIONS[name];
                if (ins == undefined)
                    throw Error(`Unknown command: "${ins}"`);
                outLines.push(ins.syntax(ins.op_or_func, args));
                ic++;
            }
            else
                throw Error("Bad line");
        }
        catch (err) {
            errorList.push(`${srcName} > line ${i_src}: ${err.message} | "${line}"`);
            if (allowPartial)
                outLines.push(line);
        }
    }
    for (const ul of unsolved_list) {
        if (_getAddr(ul.args) == undefined) {
            errorList.push(`${srcName} > Label not found: "${PATTERNS.LBL.exec(ul.args)?.[1]}"`);
            continue;
        }
        ic = ul.ic;
        outLines[ic] = ul.syntax(ul.op_or_func, ul.args);
    }
    return { lines: outLines, errors: errorList };
}
export { convert, INSTRUCTIONS };
