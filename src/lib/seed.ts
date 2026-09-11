import type { Topic } from "./types";

const now = Date.now();
const hours = (n: number) => now - n * 60 * 60 * 1000;

export const SEED_TOPICS: Topic[] = [
  {
    id: "t-onboard",
    title: "온보딩 리디자인",
    notes: "모바일은 따로 갈지, 플래그로 막을지. signup_view가 두 번 찍힘.",
    steps: [
      { id: "s1", title: "현행 플로우 감사", done: true },
      { id: "s2", title: "와이어", done: true },
      { id: "s3", title: "하이파이", done: false },
      { id: "s4", title: "핸드오프", done: false },
    ],
    createdAt: hours(48),
    updatedAt: hours(2),
  },
  {
    id: "t-rate",
    title: "API 레이트리밋",
    notes: "익명은 IP, 로그인은 토큰. 버스트 20 후 5 rps.",
    steps: [
      { id: "r1", title: "스펙", done: true },
      { id: "r2", title: "미들웨어", done: false },
      { id: "r3", title: "테스트", done: false },
    ],
    createdAt: hours(30),
    updatedAt: hours(5),
  },
  {
    id: "t-pay",
    title: "결제 웹훅 재시도",
    notes: "invoice.paid 유실. 200 먼저 주고 처리하는지 확인.",
    steps: [
      { id: "p1", title: "재현", done: false },
      { id: "p2", title: "재시도 정책", done: false },
      { id: "p3", title: "구현", done: false },
    ],
    createdAt: hours(12),
    updatedAt: hours(8),
  },
];
