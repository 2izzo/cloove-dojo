import { describe, it, expect } from "vitest";
import { BST } from "../src/binary-search-tree";

describe("BST", () => {
  it("a fresh tree contains nothing", () => {
    const tree = new BST();
    expect(tree.contains(5)).toBe(false);
  });

  it("a fresh tree's inOrder is empty", () => {
    const tree = new BST();
    expect(tree.inOrder()).toEqual([]);
  });

  it("inserting a single value makes it findable", () => {
    const tree = new BST();
    tree.insert(5);
    expect(tree.contains(5)).toBe(true);
    expect(tree.inOrder()).toEqual([5]);
  });

  it("inOrder returns values sorted", () => {
    const tree = new BST();
    tree.insert(5).insert(3).insert(8).insert(1).insert(4);
    expect(tree.inOrder()).toEqual([1, 3, 4, 5, 8]);
  });

  it("contains finds inserted values", () => {
    const tree = new BST();
    tree.insert(10).insert(5).insert(15);
    expect(tree.contains(10)).toBe(true);
    expect(tree.contains(5)).toBe(true);
    expect(tree.contains(15)).toBe(true);
  });

  it("contains returns false for absent values", () => {
    const tree = new BST();
    tree.insert(10).insert(5).insert(15);
    expect(tree.contains(7)).toBe(false);
    expect(tree.contains(0)).toBe(false);
    expect(tree.contains(100)).toBe(false);
  });

  it("inserting duplicates does not add to inOrder", () => {
    const tree = new BST();
    tree.insert(5).insert(5).insert(5);
    expect(tree.inOrder()).toEqual([5]);
  });

  it("handles negative numbers", () => {
    const tree = new BST();
    tree.insert(-5).insert(0).insert(-10);
    expect(tree.inOrder()).toEqual([-10, -5, 0]);
  });

  it("inOrder is non-mutating", () => {
    const tree = new BST();
    tree.insert(3).insert(1).insert(2);
    const first = tree.inOrder();
    const second = tree.inOrder();
    expect(first).toEqual(second);
    expect(first).not.toBe(second); // different array instances
  });
});
