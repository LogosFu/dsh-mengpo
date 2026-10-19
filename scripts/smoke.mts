/**
 * 梦婆·记忆 —— 真实数据只读冒烟（验收 #3）。
 * 对 ~/.dsh-beta/storages/session_projcache/sessions/ 做聚合，输出项目列表与 insight 计数，
 * 与任务书 §2 基线对账（12 库 / 34 条）。只读，不写任何文件。
 */
import { LocalJsonDataSource } from '../lib/scanner.js';

const ds = new LocalJsonDataSource();
const { projects, generatedAt, discovery } = await ds.listProjects(null);

console.log(`discovery: ${discovery}`);
console.log(`generatedAt: ${generatedAt}`);
console.log('');

let total = 0;
for (const project of projects) {
  total += project.insightCount;
  const status = project.status === 'ok' ? '' : ` [${project.status}${project.error ? `: ${project.error}` : ''}]`;
  console.log(`  ${String(project.insightCount).padStart(3)} 条  ${project.name}  (${project.path})${status}`);
}
console.log('');
console.log(`合计: ${projects.length} 个记忆库 / ${total} 条 insight`);
console.log('基线: 12 个记忆库 / 34 条（任务书 §2；允许运行期间数据变化）');

const globalMem = await ds.getGlobal();
console.log(`全局记忆: ${globalMem.path} — ${globalMem.content === null ? '不存在' : `${globalMem.content.length} 字符`}`);

// 抽一个项目验证 getProject 往返
const withInsights = projects.find((p) => p.insightCount > 0);
if (withInsights) {
  const detail = await ds.getProject(withInsights.path);
  console.log(`抽查 getProject(${withInsights.name}): ${detail.insights.length} 条，status=${detail.status}`);
}
