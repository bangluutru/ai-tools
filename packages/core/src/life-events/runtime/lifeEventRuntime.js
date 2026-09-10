/**
 * @file packages/core/src/life-events/runtime/lifeEventRuntime.js
 * @description
 * Bộ điều phối cốt lõi của Sự Kiện Đời Sống (Life Event Runtime Engine).
 * Khởi tạo runtime thuần túy không phụ thuộc React từ LifeEventDefinition.
 * Chịu trách nhiệm:
 * 1. Phân tích ngữ cảnh (Context Evaluation) và rẽ nhánh quyết định.
 * 2. Tính toán các mốc thời gian động theo DeadlineEngine.
 * 3. Phân giải tự động Semantic Capabilities sang Tool IDs và Hash Routes.
 * 4. Thống kê tiến độ danh mục công việc và liên kết an toàn với Storage.
 */

import { calculateDeadlineDate, formatDeadlineLabel } from '../timeline/deadlineEngine.js';
import { resolveCapability, buildCapabilityDeepLink } from '../capability/capabilityRegistry.js';
import { calculateChecklistStats, filterChecklistItems } from '../checklist/checklistEngine.js';
import { getLifeEventStorageKey, loadCompletedTasks, saveCompletedTasks, toggleCompletedTask, clearCompletedTasks } from '../storage/lifeEventStorage.js';

/**
 * Khởi tạo Life Event Runtime từ định nghĩa sự kiện
 * @param {import('../types/lifeEventTypes.js').LifeEventDefinition} definition
 * @returns {Object} Runtime instance độc lập lớp hiển thị
 */
export function createLifeEventRuntime(definition) {
  if (!definition || typeof definition !== 'object') {
    throw new Error('[LifeEventRuntime] Definition must be a valid object');
  }

  if (!definition.id || typeof definition.id !== 'string') {
    throw new Error('[LifeEventRuntime] Definition missing required string field: "id"');
  }

  if (!Array.isArray(definition.stages) || definition.stages.length === 0) {
    throw new Error(`[LifeEventRuntime] Definition "${definition.id}" must provide at least one stage`);
  }

  if (typeof definition.evaluateChecklist !== 'function') {
    throw new Error(`[LifeEventRuntime] Definition "${definition.id}" must provide an "evaluateChecklist" function`);
  }

  const id = definition.id;
  const stages = Object.freeze([...definition.stages].sort((a, b) => (a.order || 0) - (b.order || 0)));

  return {
    /**
     * Lấy ID của sự kiện
     * @returns {string}
     */
    getId() {
      return id;
    },

    /**
     * Lấy định nghĩa gốc
     * @returns {import('../types/lifeEventTypes.js').LifeEventDefinition}
     */
    getDefinition() {
      return definition;
    },

    /**
     * Lấy khóa lưu trữ localStorage của sự kiện
     * @returns {string}
     */
    getStorageKey() {
      return getLifeEventStorageKey(id);
    },

    /**
     * Sinh danh sách các giai đoạn theo ngữ cảnh
     * @param {Object} [context={}]
     * @returns {import('../types/lifeEventTypes.js').TimelineStage[]}
     */
    evaluateTimeline(context = {}) {
      if (typeof definition.evaluateTimeline === 'function') {
        const customStages = definition.evaluateTimeline(context);
        if (Array.isArray(customStages)) {
          return [...customStages].sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      }
      return stages.map((s) => ({ ...s }));
    },

    /**
     * Sinh và làm giàu danh sách các đầu việc theo ngữ cảnh
     * @param {Object} [context={}] Ngữ cảnh sự kiện
     * @param {Object} [options={}] Tùy chọn lọc
     * @returns {import('../types/lifeEventTypes.js').ChecklistItem[]}
     */
    evaluateChecklist(context = {}, options = {}) {
      // 1. Sinh danh sách thô từ hàm đánh giá của domain
      const rawItems = definition.evaluateChecklist(context, options);
      if (!Array.isArray(rawItems)) return [];

      // 2. Làm giàu từng item với Deadline Engine và Capability Registry
      const enrichedItems = rawItems.map((item) => {
        const enriched = { ...item };

        // Đảm bảo stageId và stage luôn đồng bộ
        const stageId = enriched.stageId || enriched.stage || '';
        enriched.stageId = stageId;
        enriched.stage = stageId;

        // Tính toán hạn chót động nếu có quy tắc deadlineRule
        if (enriched.deadlineRule) {
          const calculatedDate = calculateDeadlineDate(enriched.deadlineRule, context);
          if (calculatedDate) {
            enriched.calculatedDeadlineDate = calculatedDate;

            // Bổ sung nhãn ngày hiển thị nếu chưa có
            if (!enriched.deadlineDescriptionJa) {
              enriched.deadlineDescriptionJa = formatDeadlineLabel({
                rule: enriched.deadlineRule,
                calculatedDate,
                lang: 'ja',
              });
            }
            if (!enriched.deadlineDescriptionVi) {
              enriched.deadlineDescriptionVi = formatDeadlineLabel({
                rule: enriched.deadlineRule,
                calculatedDate,
                lang: 'vi',
              });
            }
            if (!enriched.deadlineDescriptionEn) {
              enriched.deadlineDescriptionEn = formatDeadlineLabel({
                rule: enriched.deadlineRule,
                calculatedDate,
                lang: 'en',
              });
            }
          }
        }

        // Phân giải capability nếu có relatedCapabilityId
        if (enriched.relatedCapabilityId) {
          const cap = resolveCapability(enriched.relatedCapabilityId);
          if (cap.isAvailable) {
            enriched.toolId = cap.toolId;
            enriched.toolLinkId = cap.toolId;
            enriched.hashRoute = cap.hashRoute;
            if (typeof enriched.deepLink === 'object' && enriched.deepLink !== null) {
              enriched.deepLink = {
                ...enriched.deepLink,
                toolId: cap.toolId,
                hashRoute: cap.hashRoute,
              };
            } else if (typeof enriched.deepLink === 'string') {
              enriched.deepLink = cap.hashRoute;
            } else {
              enriched.deepLink = cap.hashRoute;
            }
          }
        } else if (enriched.toolId || enriched.toolLinkId) {
          // Tương thích ngược với toolId truyền trực tiếp
          const tid = enriched.toolId || enriched.toolLinkId;
          enriched.toolId = tid;
          enriched.toolLinkId = tid;
          enriched.hashRoute = `#/tools/${tid}`;
          if (typeof enriched.deepLink === 'object' && enriched.deepLink !== null) {
            enriched.deepLink = {
              ...enriched.deepLink,
              toolId: tid,
              hashRoute: `#/tools/${tid}`,
            };
          } else if (typeof enriched.deepLink === 'string') {
            enriched.deepLink = `#/tools/${tid}`;
          } else {
            enriched.deepLink = `#/tools/${tid}`;
          }
        }

        return enriched;
      });

      // 3. Áp dụng bộ lọc tùy chọn nếu có
      return filterChecklistItems(enrichedItems, options);
    },

    /**
     * Tính toán thống kê tiến độ checklist
     * @param {string[]} [completedItemIds=[]]
     * @param {Object} [context={}]
     * @returns {ReturnType<typeof calculateChecklistStats>}
     */
    getChecklistStats(completedItemIds = [], context = {}) {
      const activeStages = this.evaluateTimeline(context);
      const activeItems = this.evaluateChecklist(context);
      return calculateChecklistStats(completedItemIds, activeStages, activeItems);
    },

    /**
     * Phân giải một capability liên quan
     * @param {string} capabilityId
     * @returns {ReturnType<typeof resolveCapability>}
     */
    resolveCapability(capabilityId) {
      return resolveCapability(capabilityId);
    },

    /**
     * Sinh đường dẫn deep link an toàn
     * @param {string} capabilityId
     * @param {Record<string, any>} [payload]
     * @returns {string|null}
     */
    buildDeepLink(capabilityId, payload = null) {
      return buildCapabilityDeepLink(capabilityId, payload);
    },

    /**
     * Quản lý trạng thái lưu trữ trên trình duyệt
     */
    storage: {
      loadCompleted: (customStorage) => loadCompletedTasks(id, customStorage),
      saveCompleted: (completedIds, customStorage) => saveCompletedTasks(id, completedIds, customStorage),
      toggleCompleted: (taskId, customStorage) => toggleCompletedTask(id, taskId, customStorage),
      clear: (customStorage) => clearCompletedTasks(id, customStorage),
    }
  };
}
