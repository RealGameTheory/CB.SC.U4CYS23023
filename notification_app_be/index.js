const axios = require('axios');
const { Logger } = require('../logging_middleware/logger');

const logger = new Logger('PriorityInbox');

const API_BASE = '{base_url}';
const AUTH_TOKEN = '{AUTH_KEY}';

const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };

class MinHeap {
  constructor() { this.h = []; }
  size() { return this.h.length; }
  peek() { return this.h[0]; }

  static cmp(a, b) {
    if (a.score !== b.score) return a.score - b.score;
    return new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime();
  }

  _swap(i, j) { [this.h[i], this.h[j]] = [this.h[j], this.h[i]]; }

  push(item) {
    this.h.push(item);
    let i = this.h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (MinHeap.cmp(this.h[i], this.h[p]) >= 0) break;
      this._swap(i, p);
      i = p;
    }
  }

  pop() {
    const top = this.h[0];
    const last = this.h.pop();
    if (this.h.length > 0) {
      this.h[0] = last;
      let i = 0;
      while (true) {
        let s = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < this.h.length && MinHeap.cmp(this.h[l], this.h[s]) < 0) s = l;
        if (r < this.h.length && MinHeap.cmp(this.h[r], this.h[s]) < 0) s = r;
        if (s === i) break;
        this._swap(i, s);
        i = s;
      }
    }
    return top;
  }

  sorted() {
    return [...this.h].sort((a, b) => -MinHeap.cmp(a, b));
  }
}

async function fetchNotifications() {
  logger.info('Fetching notifications from API', { url: API_URL });
  const { data } = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
  });
  logger.info(`Received ${data.notifications.length} notifications`);
  return data.notifications;
}

function score(notification) {
  return TYPE_WEIGHT[notification.Type] || 0;
}

function topN(notifications, n) {
  logger.info(`Selecting top ${n} from ${notifications.length} notifications`);
  const heap = new MinHeap();

  for (const notif of notifications) {
    const scored = { ...notif, score: score(notif) };
    if (heap.size() < n) {
      heap.push(scored);
    } else if (MinHeap.cmp(scored, heap.peek()) > 0) {
      heap.pop();
      heap.push(scored);
    }
  }

  return heap.sorted();
}

async function main() {
  const n = parseInt(process.argv[2], 10) || 10;
  logger.info(`Priority Inbox started – top ${n} requested`);

  try {
    const notifications = await fetchNotifications();
    const top = topN(notifications, n);

    logger.info('=== Priority Inbox Results ===');
    top.forEach((item, i) => {
      logger.info(`#${i + 1}`, {
        ID: item.ID,
        Type: item.Type,
        Message: item.Message,
        Timestamp: item.Timestamp,
        PriorityScore: item.score
      });
    });

    logger.info(`Total notifications processed: ${notifications.length}`);
    logger.info(`Returned top ${top.length} by priority`);
  } catch (err) {
    logger.error('Failed to process notifications', { error: err.message });
    process.exit(1);
  }
}

main();
