import { describe, it, expect } from "vitest";
import { PriorityQueue } from "../src/priority-queue";

describe("PriorityQueue", () => {
  it("starts empty", () => {
    const pq = new PriorityQueue<number>();
    expect(pq.size).toBe(0);
  });

  it("pushes and returns minimum first", () => {
    const pq = new PriorityQueue<number>();
    pq.push(5).push(2).push(8);
    expect(pq.peek()).toBe(2);
  });

  it("pops in ascending order", () => {
    const pq = new PriorityQueue<number>();
    pq.push(5).push(2).push(8).push(1).push(3);
    const out: number[] = [];
    while (pq.size > 0) out.push(pq.pop());
    expect(out).toEqual([1, 2, 3, 5, 8]);
  });

  it("peek does not modify size", () => {
    const pq = new PriorityQueue<number>();
    pq.push(1).push(2);
    pq.peek();
    expect(pq.size).toBe(2);
  });

  it("pop reduces size", () => {
    const pq = new PriorityQueue<number>();
    pq.push(1).push(2);
    pq.pop();
    expect(pq.size).toBe(1);
  });

  it("handles duplicates", () => {
    const pq = new PriorityQueue<number>();
    pq.push(3).push(3).push(3);
    expect(pq.pop()).toBe(3);
    expect(pq.pop()).toBe(3);
    expect(pq.pop()).toBe(3);
  });

  it("throws on pop from empty", () => {
    expect(() => new PriorityQueue<number>().pop()).toThrow();
  });

  it("throws on peek from empty", () => {
    expect(() => new PriorityQueue<number>().peek()).toThrow();
  });

  it("supports custom comparator (max-heap)", () => {
    const pq = new PriorityQueue<number>((a, b) => b - a);
    pq.push(1).push(5).push(3);
    expect(pq.pop()).toBe(5);
    expect(pq.pop()).toBe(3);
    expect(pq.pop()).toBe(1);
  });

  it("works on objects with comparator", () => {
    const pq = new PriorityQueue<{ p: number; v: string }>((a, b) => a.p - b.p);
    pq.push({ p: 3, v: "c" }).push({ p: 1, v: "a" }).push({ p: 2, v: "b" });
    expect(pq.pop().v).toBe("a");
    expect(pq.pop().v).toBe("b");
    expect(pq.pop().v).toBe("c");
  });

  it("interleaves push and pop correctly", () => {
    const pq = new PriorityQueue<number>();
    pq.push(5);
    pq.push(2);
    expect(pq.pop()).toBe(2);
    pq.push(1);
    expect(pq.pop()).toBe(1);
    expect(pq.pop()).toBe(5);
  });
});
