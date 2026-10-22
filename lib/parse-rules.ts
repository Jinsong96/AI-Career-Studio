import { TAG_KEYWORDS } from "./data";

/** 降级方案：关键词词典匹配 */
export function ruleParse(freeText: string, availableTags: string[]): { tags: string[]; interpretation: string } {
  const hits: string[] = [];
  // 长关键词优先，避免"不想太累"被"累"之类的短词抢先
  const keys = Object.keys(TAG_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const tag = TAG_KEYWORDS[k];
    if (freeText.includes(k) && availableTags.includes(tag) && !hits.includes(tag)) hits.push(tag);
  }
  const tags = hits.slice(0, 5);
  const interpretation = tags.length ? `你似乎看重：${tags.join("、")}。` : "暂时没有从这句话里读出明确的偏好。";
  return { tags, interpretation };
}
