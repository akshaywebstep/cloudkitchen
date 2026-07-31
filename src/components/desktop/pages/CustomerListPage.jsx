import React from "react";
import { SearchFilterRow } from "../../ui/SearchFilterRow";
import { OrderCustomerTable } from "./OrderListPage";

export function CustomerListPage() {
  return (
    <div className="mx-auto max-w-[1380px] space-y-10">
      <SearchFilterRow calendarTone="blue" />
      <OrderCustomerTable footerGap="mt-44" />
    </div>
  );
}
