// A small educational 6502, deliberately not a cycle-accurate Apple-1.
// ECHO ($FFEF) is a simulated monitor service; BRK stops this laboratory.
export const hex = (n, width = 2) => (Number(n) >>> 0).toString(16).toUpperCase().padStart(width, '0');

export const DEMOS = [
  {
    id: 'bonjour', title: 'Dire bonjour', start: 0x0300,
    description: 'Le processeur charge un caractère dans A, puis appelle la routine d’affichage du moniteur.',
    bytes: [0xA9,0xC8,0x20,0xEF,0xFF,0xA9,0xC9,0x20,0xEF,0xFF,0xA9,0xA1,0x20,0xEF,0xFF,0x00]
  },
  {
    id: 'memoire', title: 'Écrire en mémoire', start: 0x0300,
    description: 'Une valeur est chargée, enregistrée à l’adresse $0400, puis augmentée.',
    bytes: [0xA9,0x2A,0x8D,0x00,0x04,0x18,0x69,0x01,0x8D,0x01,0x04,0x00]
  },
  {
    id: 'ascii', title: 'Le test de 1976', start: 0x0300,
    description: 'Adaptation du programme du manuel : X compte et la routine ECHO affiche les caractères en boucle.',
    bytes: [0xA9,0x00,0xAA,0x20,0xEF,0xFF,0xE8,0x8A,0x4C,0x02,0x03]
  }
];

export class CPU {
  constructor() {
    this.memory = new Uint8Array(65536);
    this.start = 0x0300;
    this.reset();
  }
  reset() {
    this.a = 0; this.x = 0; this.y = 0; this.pc = this.start; this.sp = 0xFF;
    this.p = 0x20; this.screen = ''; this.halted = false; this.steps = 0; this.last = null;
  }
  load(bytes, start = 0x0300) {
    if (!Number.isInteger(start) || start < 0 || start > 0xFFFF || start + bytes.length > 0x10000) throw new RangeError('Le programme dépasse la mémoire.');
    this.memory.fill(0); this.memory.set(bytes, start); this.start = start; this.reset();
  }
  snapshot() { return { a:this.a, x:this.x, y:this.y, pc:this.pc, sp:this.sp, p:this.p, steps:this.steps }; }
  fetch() { const b = this.memory[this.pc]; this.pc = (this.pc + 1) & 0xFFFF; return b; }
  word() { const lo = this.fetch(), hi = this.fetch(); return lo | (hi << 8); }
  setFlag(mask, value) { this.p = value ? (this.p | mask) : (this.p & ~mask); }
  nz(v) { v &= 0xFF; this.setFlag(0x02, v === 0); this.setFlag(0x80, (v & 0x80) !== 0); return v; }
  write(addr, val, writes) { addr &= 0xFFFF; val &= 0xFF; const old = this.memory[addr]; this.memory[addr] = val; writes.push({address:addr, old, value:val}); }
  push(v, writes) { this.write(0x100 | this.sp, v, writes); this.sp = (this.sp - 1) & 0xFF; }
  pop() { this.sp = (this.sp + 1) & 0xFF; return this.memory[0x100 | this.sp]; }
  step() {
    if (this.halted) return this.last;
    const before = this.snapshot(), at = this.pc, opcode = this.fetch(), writes = [];
    let mnemonic = '', description = '', output = '';
    const byte = () => '$' + hex(this.fetch());
    const addr = () => '$' + hex(this.word(), 4);
    switch (opcode) {
      case 0xA9: { const v=this.fetch(); this.a=this.nz(v); mnemonic=`LDA #$${hex(v)}`; description=`Charge $${hex(v)} dans l’accumulateur A.`; break; }
      case 0xA2: { const v=this.fetch(); this.x=this.nz(v); mnemonic=`LDX #$${hex(v)}`; description=`Charge $${hex(v)} dans le registre X.`; break; }
      case 0xA0: { const v=this.fetch(); this.y=this.nz(v); mnemonic=`LDY #$${hex(v)}`; description=`Charge $${hex(v)} dans le registre Y.`; break; }
      case 0xAD: { const v=this.word(); this.a=this.nz(this.memory[v]); mnemonic=`LDA $${hex(v,4)}`; description=`Lit la mémoire à $${hex(v,4)} dans A.`; break; }
      case 0xA5: { const v=this.fetch(); this.a=this.nz(this.memory[v]); mnemonic=`LDA $${hex(v)}`; description=`Lit la page zéro à $${hex(v)} dans A.`; break; }
      case 0x8D: { const v=this.word(); this.write(v,this.a,writes); mnemonic=`STA $${hex(v,4)}`; description=`Écrit A à l’adresse $${hex(v,4)}.`; break; }
      case 0x85: { const v=this.fetch(); this.write(v,this.a,writes); mnemonic=`STA $${hex(v)}`; description=`Écrit A dans la page zéro à $${hex(v)}.`; break; }
      case 0x8E: { const v=this.word(); this.write(v,this.x,writes); mnemonic=`STX $${hex(v,4)}`; description=`Écrit X à l’adresse $${hex(v,4)}.`; break; }
      case 0x18: this.setFlag(1,false); mnemonic='CLC'; description='Efface la retenue avant une addition.'; break;
      case 0x38: this.setFlag(1,true); mnemonic='SEC'; description='Active le drapeau de retenue.'; break;
      case 0x69: { const v=this.fetch(), a=this.a, sum=a+v+(this.p&1); this.setFlag(1,sum>255); this.setFlag(0x40,!!(~(a^v)&(a^sum)&0x80)); this.a=this.nz(sum); mnemonic=`ADC #$${hex(v)}`; description=`Additionne $${hex(v)} et la retenue à A (mode binaire).`; break; }
      case 0xE8: this.x=this.nz(this.x+1); mnemonic='INX'; description='Ajoute 1 au registre X.'; break;
      case 0xCA: this.x=this.nz(this.x-1); mnemonic='DEX'; description='Soustrait 1 au registre X.'; break;
      case 0xC8: this.y=this.nz(this.y+1); mnemonic='INY'; description='Ajoute 1 au registre Y.'; break;
      case 0x88: this.y=this.nz(this.y-1); mnemonic='DEY'; description='Soustrait 1 au registre Y.'; break;
      case 0xAA: this.x=this.nz(this.a); mnemonic='TAX'; description='Copie A dans X.'; break;
      case 0x8A: this.a=this.nz(this.x); mnemonic='TXA'; description='Copie X dans A.'; break;
      case 0xA8: this.y=this.nz(this.a); mnemonic='TAY'; description='Copie A dans Y.'; break;
      case 0x98: this.a=this.nz(this.y); mnemonic='TYA'; description='Copie Y dans A.'; break;
      case 0x4C: { const v=this.word(); this.pc=v; mnemonic=`JMP $${hex(v,4)}`; description=`Continue le programme à $${hex(v,4)}.`; break; }
      case 0x20: { const v=this.word(); mnemonic=`JSR $${hex(v,4)}`;
        if (v===0xFFEF) { const c=this.a&0x7F; if(c===13) output='\n'; else if(c>=32 && c<=126) output=String.fromCharCode(c); if(output) { let lines=this.screen.split('\n'); if(output==='\n') lines.push(''); else { if(lines[lines.length-1].length>=40) lines.push(''); lines[lines.length-1]+=output; } this.screen=lines.slice(-24).join('\n'); } description='Appelle ECHO : le caractère dans A est envoyé à l’écran (service simulé).'; }
        else { const ret=(this.pc-1)&0xFFFF; this.push(ret>>8,writes); this.push(ret,writes); this.pc=v; description=`Appelle la sous-routine $${hex(v,4)} et sauvegarde le retour sur la pile.`; } break; }
      case 0x60: { const lo=this.pop(), hi=this.pop(); this.pc=((hi<<8)|lo)+1 & 0xFFFF; mnemonic='RTS'; description='Revient de la sous-routine grâce à l’adresse enregistrée sur la pile.'; break; }
      case 0xD0: case 0xF0: case 0x10: case 0x30: { const b=this.fetch(), offset=b<128?b:b-256; const names={0xD0:'BNE',0xF0:'BEQ',0x10:'BPL',0x30:'BMI'}; const take=opcode===0xD0?!(this.p&2):opcode===0xF0?!!(this.p&2):opcode===0x10?!(this.p&0x80):!!(this.p&0x80); const dest=(this.pc+offset)&0xFFFF; if(take)this.pc=dest; mnemonic=`${names[opcode]} $${hex(dest,4)}`; description=take?'Condition remplie : le branchement est suivi.':'Condition non remplie : le programme continue.'; break; }
      case 0xEA: mnemonic='NOP'; description='Ne fait rien pendant cette instruction.'; break;
      case 0x00: this.halted=true; mnemonic='BRK'; description='Arrête la démonstration (comportement simplifié de BRK).'; break;
      default: this.halted=true; mnemonic=`??? $${hex(opcode)}`; description=`Instruction $${hex(opcode)} non prise en charge par ce simulateur pédagogique.`;
    }
    this.steps++;
    return this.last={pc:at,opcode,mnemonic,description,before,after:this.snapshot(),writes,output};
  }
}
