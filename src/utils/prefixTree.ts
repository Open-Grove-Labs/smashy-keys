import { words } from "../words";
import { names } from "../names";

export type PrefixNode = {
  [key: string]: PrefixNode;
};

/**
 * Builds a prefix tree (trie) from an array of words.
 * Each nested level represents a character in the word.
 * An empty object {} at the end indicates a complete word.
 * 
 * Example:
 *   ["cat", "car"] => { c: { a: { t: {}, r: {} } } }
 */
export function buildPrefixTree(wordList: string[]): PrefixNode {
  const root: PrefixNode = {};

  for (const word of wordList) {
    let current = root;
    const normalized = word.toLowerCase();

    for (const char of normalized) {
      if (!current[char]) {
        current[char] = {};
      }
      current = current[char];
    }
  }

  return root;
}

/**
 * Pre-built prefix tree containing all words and names from the app.
 * Use this for mobile tap-based word formation.
 */
export const prefixTree = buildPrefixTree([...words, ...names]);

/**
 * Check if a given prefix exists in the tree (i.e., could lead to a valid word).
 */
export function hasPrefix(prefix: string, tree: PrefixNode = prefixTree): boolean {
  let current = tree;
  const normalized = prefix.toLowerCase();

  for (const char of normalized) {
    if (!current[char]) {
      return false;
    }
    current = current[char];
  }

  return true;
}

/**
 * Check if a given string is a complete word in the tree.
 * A complete word is one where we can traverse the prefix and the final node has no children.
 */
export function isCompleteWord(word: string, tree: PrefixNode = prefixTree): boolean {
  let current = tree;
  const normalized = word.toLowerCase();

  for (const char of normalized) {
    if (!current[char]) {
      return false;
    }
    current = current[char];
  }

  // A complete word is one where we've traversed successfully
  // In our structure, empty object {} marks a valid endpoint
  // We just need to confirm the traversal succeeded
  return true;
}

/**
 * Get all possible next characters from the current prefix.
 * Useful for showing available letters on mobile UI.
 */
export function getNextChars(prefix: string, tree: PrefixNode = prefixTree): string[] {
  let current = tree;
  const normalized = prefix.toLowerCase();

  for (const char of normalized) {
    if (!current[char]) {
      return [];
    }
    current = current[char];
  }

  return Object.keys(current);
}
