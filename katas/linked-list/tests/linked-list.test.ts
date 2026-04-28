import { describe, it, expect } from "vitest";
import { LinkedList } from "../src/linked-list";

describe("LinkedList", () => {
  it("starts empty", () => {
    const list = new LinkedList<number>();
    expect(list.length).toBe(0);
    expect(list.toArray()).toEqual([]);
  });

  it("pushes a single value", () => {
    const list = new LinkedList<number>();
    list.push(1);
    expect(list.length).toBe(1);
    expect(list.toArray()).toEqual([1]);
  });

  it("pushes multiple values in order", () => {
    const list = new LinkedList<number>();
    list.push(1).push(2).push(3);
    expect(list.toArray()).toEqual([1, 2, 3]);
  });

  it("unshift prepends values", () => {
    const list = new LinkedList<number>();
    list.push(2).unshift(1);
    expect(list.toArray()).toEqual([1, 2]);
  });

  it("pop removes and returns the tail", () => {
    const list = new LinkedList<number>();
    list.push(1).push(2).push(3);
    expect(list.pop()).toBe(3);
    expect(list.toArray()).toEqual([1, 2]);
    expect(list.length).toBe(2);
  });

  it("shift removes and returns the head", () => {
    const list = new LinkedList<number>();
    list.push(1).push(2).push(3);
    expect(list.shift()).toBe(1);
    expect(list.toArray()).toEqual([2, 3]);
    expect(list.length).toBe(2);
  });

  it("pop on a single-element list empties it", () => {
    const list = new LinkedList<number>();
    list.push(1);
    expect(list.pop()).toBe(1);
    expect(list.length).toBe(0);
    expect(list.toArray()).toEqual([]);
  });

  it("shift on a single-element list empties it", () => {
    const list = new LinkedList<number>();
    list.push(1);
    expect(list.shift()).toBe(1);
    expect(list.length).toBe(0);
  });

  it("supports push after pop-to-empty", () => {
    const list = new LinkedList<number>();
    list.push(1).pop();
    list.push(2);
    expect(list.toArray()).toEqual([2]);
  });

  it("throws on pop from empty", () => {
    const list = new LinkedList<number>();
    expect(() => list.pop()).toThrow();
  });

  it("throws on shift from empty", () => {
    const list = new LinkedList<number>();
    expect(() => list.shift()).toThrow();
  });

  it("works with strings (generic)", () => {
    const list = new LinkedList<string>();
    list.push("a").push("b");
    expect(list.toArray()).toEqual(["a", "b"]);
  });
});
