const axios = require('axios');
const { Logger } = require('../logging_middleware/logger');

const logger = new Logger('VehicleScheduler');

const API_BASE = '{base_url}';
const AUTH_TOKEN = '{AUTH_KEY}';

const headers = { Authorization: `Bearer ${AUTH_TOKEN}` };

async function fetchDepots() {
  logger.info('Fetching depots from API', { url: `${API_BASE}/depots` });
  const { data } = await axios.get(`${API_BASE}/depots`, { headers });
  logger.info(`Received ${data.depots.length} depots`);
  return data.depots;
}

async function fetchVehicles() {
  logger.info('Fetching vehicles from API', { url: `${API_BASE}/vehicles` });
  const { data } = await axios.get(`${API_BASE}/vehicles`, { headers });
  logger.info(`Received ${data.vehicles.length} vehicle tasks`);
  return data.vehicles;
}

function knapsack(tasks, capacity) {
  const n = tasks.length;
  logger.info('Running 0-1 Knapsack DP', { tasks: n, capacity });

  const dp = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const { Duration: w, Impact: v } = tasks[i - 1];
    for (let c = 0; c <= capacity; c++) {
      dp[i][c] = dp[i - 1][c];
      if (w <= c) {
        dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - w] + v);
      }
    }
  }

  const selected = [];
  let remaining = capacity;
  for (let i = n; i >= 1; i--) {
    if (dp[i][remaining] !== dp[i - 1][remaining]) {
      selected.push(tasks[i - 1]);
      remaining -= tasks[i - 1].Duration;
    }
  }

  const totalImpact = dp[n][capacity];
  const totalDuration = capacity - remaining;

  logger.info('Knapsack complete', {
    selectedTasks: selected.length,
    totalImpact,
    totalDuration,
    remainingHours: remaining
  });

  return { selected, totalImpact, totalDuration };
}

async function main() {
  logger.info('Vehicle Maintenance Scheduler started');

  try {
    const depots = await fetchDepots();
    const vehicles = await fetchVehicles();

    const budget = depots.reduce((sum, d) => sum + d.MechanicHours, 0);
    logger.info('Total mechanic-hour budget', {
      depots: depots.map(d => ({ ID: d.ID, hours: d.MechanicHours })),
      totalBudget: budget
    });

    const { selected, totalImpact, totalDuration } = knapsack(vehicles, budget);

    logger.info('=== Scheduling Result ===');
    logger.info(`Budget: ${budget} mechanic-hours`);
    logger.info(`Tasks selected: ${selected.length} / ${vehicles.length}`);
    logger.info(`Total Impact:   ${totalImpact}`);
    logger.info(`Total Duration: ${totalDuration} hours`);
    logger.info(`Remaining:      ${budget - totalDuration} hours`);

    logger.info('-- Selected Tasks --');
    selected.forEach((t, i) => {
      logger.info(`  ${i + 1}. ${t.TaskID}  Duration=${t.Duration}h  Impact=${t.Impact}`);
    });

    const result = {
      depots,
      totalBudget: budget,
      selectedTasks: selected,
      summary: {
        totalTasksAvailable: vehicles.length,
        tasksSelected: selected.length,
        totalImpact,
        totalDuration,
        remainingHours: budget - totalDuration
      }
    };
    process.stdout.write('\n' + JSON.stringify(result, null, 2) + '\n');

  } catch (err) {
    logger.error('Scheduler failed', { error: err.message });
    process.exit(1);
  }
}

main();
