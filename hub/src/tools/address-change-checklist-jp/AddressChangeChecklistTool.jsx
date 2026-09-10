/**
 * @file hub/src/tools/address-change-checklist-jp/AddressChangeChecklistTool.jsx
 * @description Wrapper tool for Japan Address Change Master Checklist in Toolio Hub.
 */

import React from 'react';
import AddressChangeChecklistView from '@ai-tools/core/components/housing/AddressChangeChecklistView.jsx';

export default function AddressChangeChecklistTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <AddressChangeChecklistView lang={displayLang || 'ja'} />
    </div>
  );
}
