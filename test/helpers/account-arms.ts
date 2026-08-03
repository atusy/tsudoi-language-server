import { expect, test } from "bun:test";
import { corruptOneLetter, corruptOutsideSubject, type ReadAccount } from "./readme.ts";

/**
 * THE ARMS EVERY `read` ROW OWES, DRIVEN FROM THE TABLE AND SPELLED ONCE.
 *
 * IT IS A FUNCTION AND NOT A COPY IN EACH ARM FILE, for the reason the fence
 * reader is one reader: two spellings of one premise is what a join exists to
 * kill, and the two files that call this differ ONLY in which accounts they can
 * run -- never in what an account owes.
 *
 * THE MUTATION ARMS ARE WHERE THE TEETH ARE. `it is read` is not `it is
 * checked`, and this repository has the instance: the install block's readers
 * are a negative match that survives any corruption, a `contains`, and a split
 * taking the last token, so `bun frobnicate ../<checkout>/x.tgz` satisfies every
 * one of them. What separates an account from a rubber stamp is that corrupting
 * the block INSIDE its subject makes the assertion say no, and corrupting it
 * OUTSIDE leaves it saying yes -- the account's boundary asserted rather than
 * assumed.
 *
 * EVERY ELEMENT OF THE PROJECTION, ONE AT A TIME, AND NOT THE FIRST. A subject
 * carrying one load-bearing member and four decorative ones would satisfy a
 * reading that corrupted whichever came first, and the decorative four are
 * exactly what an account grows when nobody is looking.
 */
export function armReadAccounts(accounts: readonly ReadAccount[]): void {
  const seen = new Map<string, number>();
  for (const account of accounts) {
    const { consumer, form, block, markdown, document, at } = account;
    const against = form.against(markdown, document);
    // NAMED BY ORDINAL AND NOT BY LINE, WHICH IS A DECISION ABOUT THE
    // PERTURBATION REGISTRY RATHER THAN ABOUT READABILITY: a record names its
    // arm by the exact string `test()` spells, so a name carrying a line number
    // goes REFUSED on any edit ABOVE the block -- and a REFUSED reads to the
    // author as `the registry is stale` and sends them to change a record that
    // is right. The line is on the assertion instead, where it is wanted.
    const ordinal = (seen.get(`${consumer.name} ${at}`) ?? 0) + 1;
    seen.set(`${consumer.name} ${at}`, ordinal);
    const where = `${at} block ${String(ordinal)}`;

    test(`${consumer.name} holds over ${where}`, () => {
      // THE LINE RIDES ON THE ASSERTION rather than on the name, so a failure
      // says which block without a record having to spell a number that moves.
      expect(
        `${at}:${String(block.line)} ${String(form.holds(form.subject(block), against))}`,
      ).toBe(`${at}:${String(block.line)} true`);
    });

    // WHAT THIS ARM DOES NOT SAY, MEASURED RATHER THAN REASONED AND RECORDED
    // HERE BECAUSE ITS NAME INVITES THE STRONGER READING: IT IS SATISFIED BY A
    // PROJECTION THAT IS A CONSTANT. `replace` is a no-op when `part` is not in
    // the body, so a subject the block does not contain leaves `holds` false
    // over the UNTOUCHED block, and false is what this arm asks for. MEASURED
    // with the layout row's subject replaced by a constant: 925 pass / 9 fail,
    // and THIS ARM IS GREEN in that run.
    //
    // WHAT CAUGHT IT INSTEAD, NAMED SO THE GAP IS NOT READ AS AN UNGUARDED ONE:
    // `readmeCoverage`'s fourth refusal -- a projection member the block's own
    // bytes do not contain -- fired FOUR TIMES, the OUTSIDE arm below reddened
    // because a constant cannot survive a corruption it never covered, and the
    // `holds` arm above reddened because the account stopped being true at all.
    // The remaining three reds are the registry's, over the two arms it names in
    // test/readme-layout.test.ts and their shared baseline.
    test(`corrupting ${where} INSIDE ${consumer.name}'s subject makes it say no`, () => {
      const subject = form.subject(block);
      // The pair for the loop below, which is green over no elements at all.
      expect(subject.length).toBeGreaterThan(0);
      for (const part of subject) {
        const corrupted = { ...block, body: block.body.replace(part, corruptOneLetter(part)) };
        // NAMED ON THE ASSERTION LINE, so a projection member that turned out to
        // be decorative says WHICH one rather than `expected false`.
        expect(`${part} -> ${String(form.holds(form.subject(corrupted), against))}`).toBe(
          `${part} -> false`,
        );
      }
    });

    test(`corrupting ${where} OUTSIDE ${consumer.name}'s subject leaves it saying yes`, () => {
      const body = corruptOutsideSubject(block.body, form.subject(block));
      // THE PAIR: a corruption that changed nothing would make the line below
      // true of the untouched block, which is not a reading of anything.
      expect(body).not.toBe(block.body);
      expect(form.holds(form.subject({ ...block, body }), against)).toBe(true);
    });
  }
}
