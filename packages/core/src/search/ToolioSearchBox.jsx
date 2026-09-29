import { SearchBoxView } from '@chotto/search';
// CSS của gói nạp ở đây, một lần, để mọi nơi gắn ô (hub lẫn app standalone) đều có.
import '@chotto/search/styles.css';
import { searchLabels } from './toolioSearch.js';

/**
 * SearchBoxView kèm nhãn theo ngôn ngữ Toolio. Mọi prop khác chuyển thẳng
 * cho gói (`size`, `placement`, `count`, `renderItem`, `inputRef`…).
 */
export function ToolioSearchBox({ lang = 'vi', labels, ...props }) {
  return <SearchBoxView labels={{ ...searchLabels(lang), ...labels }} {...props} />;
}
