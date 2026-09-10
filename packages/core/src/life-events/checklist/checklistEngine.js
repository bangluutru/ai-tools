/**
 * @file packages/core/src/life-events/checklist/checklistEngine.js
 * @description
 * Động cơ tính toán danh mục công việc (Checklist Engine) cho Life Event Foundation.
 * Tính toán số lượng đầu việc, số lượng hoàn thành, tiến độ tổng thể %, trạng thái hoàn thành từng chặng,
 * và hỗ trợ lọc danh sách linh hoạt.
 */

/**
 * Tính toán thống kê tiến độ hoàn thành các đầu việc trong checklist
 * Hỗ trợ cả 2 định dạng dữ liệu: danh sách giai đoạn có lồng tasks hoặc danh sách phẳng các items
 * @param {string[]} [completedItemIds=[]] Danh sách các mã đầu việc đã hoàn thành
 * @param {Array<Object>} [stages=[]] Danh sách các giai đoạn
 * @param {Array<Object>} [allItems=[]] Danh sách phẳng tất cả các đầu việc (nếu có)
 * @returns {{
 *   totalTasks: number,
 *   totalCompleted: number,
 *   overallPercent: number,
 *   isAllCompleted: boolean,
 *   stageStats: Array<{
 *     stageId: string,
 *     order: number,
 *     total: number,
 *     completed: number,
 *     percent: number,
 *     isFullyCompleted: boolean
 *   }>
 * }}
 */
export function calculateChecklistStats(completedItemIds = [], stages = [], allItems = []) {
  const completedSet = new Set(Array.isArray(completedItemIds) ? completedItemIds : []);

  // Nếu truyền stages có chứa tasks / items lồng bên trong
  if (Array.isArray(stages) && stages.length > 0 && stages.some((s) => s.tasks || s.items)) {
    let totalTasks = 0;
    let totalCompleted = 0;

    const stageStats = stages.map((stage, idx) => {
      const stageTasks = stage.tasks || stage.items || [];
      const stageTotal = stageTasks.length;
      const stageCompleted = stageTasks.filter((t) => completedSet.has(t.id)).length;
      const percent = stageTotal > 0 ? Math.round((stageCompleted / stageTotal) * 100) : 0;

      totalTasks += stageTotal;
      totalCompleted += stageCompleted;

      return {
        stageId: stage.stageId || stage.id || `stage_${idx + 1}`,
        order: Number(stage.order || idx + 1),
        total: stageTotal,
        completed: stageCompleted,
        percent,
        isFullyCompleted: stageCompleted === stageTotal && stageTotal > 0,
      };
    });

    const overallPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    return {
      totalTasks,
      totalCompleted,
      overallPercent,
      isAllCompleted: totalCompleted === totalTasks && totalTasks > 0,
      stageStats,
    };
  }

  // Nếu truyền danh sách phẳng allItems
  if (Array.isArray(allItems) && allItems.length > 0) {
    const totalTasks = allItems.length;
    const totalCompleted = allItems.filter((item) => completedSet.has(item.id)).length;
    const overallPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    // Nhóm theo stageId nếu có stages được truyền
    const stageMap = new Map();
    if (Array.isArray(stages)) {
      stages.forEach((s, idx) => {
        const sid = s.stageId || s.id || `stage_${idx + 1}`;
        stageMap.set(sid, {
          stageId: sid,
          order: Number(s.order || idx + 1),
          total: 0,
          completed: 0,
        });
      });
    }

    allItems.forEach((item) => {
      const sid = item.stageId || item.stage;
      if (sid && stageMap.has(sid)) {
        const st = stageMap.get(sid);
        st.total += 1;
        if (completedSet.has(item.id)) st.completed += 1;
      }
    });

    const stageStats = Array.from(stageMap.values()).map((st) => ({
      ...st,
      percent: st.total > 0 ? Math.round((st.completed / st.total) * 100) : 0,
      isFullyCompleted: st.completed === st.total && st.total > 0,
    }));

    return {
      totalTasks,
      totalCompleted,
      overallPercent,
      isAllCompleted: totalCompleted === totalTasks && totalTasks > 0,
      stageStats,
    };
  }

  // Fallback an toàn khi chưa có dữ liệu
  return {
    totalTasks: 0,
    totalCompleted: 0,
    overallPercent: 0,
    isAllCompleted: false,
    stageStats: [],
  };
}

/**
 * Lọc danh mục công việc theo các tiêu chí
 * @param {Array<Object>} items Danh sách các đầu việc
 * @param {Object} [filterOptions={}]
 * @param {string} [filterOptions.stageId] Lọc theo mã giai đoạn
 * @param {string} [filterOptions.requirement] Lọc theo mức độ bắt buộc ('required', 'recommended', 'conditional')
 * @param {boolean} [filterOptions.isUrgent] Lọc theo tính khẩn cấp
 * @param {Set<string>|Array<string>} [filterOptions.completedIds] Danh sách id đã hoàn thành
 * @param {'all'|'completed'|'uncompleted'} [filterOptions.completionFilter='all']
 * @returns {Array<Object>}
 */
export function filterChecklistItems(items = [], filterOptions = {}) {
  if (!Array.isArray(items)) return [];

  const completedSet = filterOptions.completedIds instanceof Set
    ? filterOptions.completedIds
    : new Set(Array.isArray(filterOptions.completedIds) ? filterOptions.completedIds : []);

  return items.filter((item) => {
    // Lọc theo stageId hoặc stage
    if (filterOptions.stageId && filterOptions.stageId !== 'all') {
      const itemStage = item.stageId || item.stage;
      if (itemStage !== filterOptions.stageId) return false;
    }

    // Lọc theo mức độ bắt buộc
    if (filterOptions.requirement && item.requirement !== filterOptions.requirement) {
      return false;
    }

    // Lọc theo cờ khẩn cấp
    if (filterOptions.isUrgent !== undefined && Boolean(item.isUrgent) !== Boolean(filterOptions.isUrgent)) {
      return false;
    }

    // Lọc theo trạng thái hoàn thành
    if (filterOptions.completionFilter === 'completed' && !completedSet.has(item.id)) {
      return false;
    }
    if (filterOptions.completionFilter === 'uncompleted' && completedSet.has(item.id)) {
      return false;
    }

    return true;
  });
}
