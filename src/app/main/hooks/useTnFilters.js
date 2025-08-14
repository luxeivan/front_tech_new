"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { val } from "@/lib/format";

// Управление фильтрами + генерация вариантов + функция применения
export default function useTnFilters(uniqueOpen) {
  const [filters, setFilters] = useState({
    OWN_SCNAME: "Все",
    SCNAME: "Все",
    VIOLATION_TYPE: "Все",
    OBJECTTYPE81: "Все",
    F81_060_EVENTDATETIME: "Все",
    CREATE_DATETIME: "Все",
    F81_070_RESTOR_SUPPLAYDATETIME: "Все",
    F81_290_RECOVERYDATETIME: "Все",
  });

  const filterOptions = useMemo(() => {
    const o = {};
    ["OWN_SCNAME", "SCNAME", "VIOLATION_TYPE", "OBJECTTYPE81"].forEach(
      (key) => {
        o[key] = Array.from(
          new Set(uniqueOpen.map((r) => val(r[key])).filter(Boolean))
        );
      }
    );
    [
      "F81_060_EVENTDATETIME",
      "CREATE_DATETIME",
      "F81_070_RESTOR_SUPPLAYDATETIME",
      "F81_290_RECOVERYDATETIME",
    ].forEach((key) => {
      o[key] = Array.from(
        new Set(
          uniqueOpen
            .map((r) => val(r[key]))
            .filter(Boolean)
            .map((d) => dayjs(d).format("DD.MM.YYYY"))
        )
      );
    });
    return o;
  }, [uniqueOpen]);

  const applyFilters = (record, f) => {
    if (f.OWN_SCNAME !== "Все" && val(record.OWN_SCNAME) !== f.OWN_SCNAME)
      return false;
    if (f.SCNAME !== "Все" && val(record.SCNAME) !== f.SCNAME) return false;
    if (
      f.VIOLATION_TYPE !== "Все" &&
      val(record.VIOLATION_TYPE) !== f.VIOLATION_TYPE
    )
      return false;
    if (f.OBJECTTYPE81 !== "Все" && val(record.OBJECTTYPE81) !== f.OBJECTTYPE81)
      return false;

    const dt = (key) =>
      val(record[key]) ? dayjs(val(record[key])).format("DD.MM.YYYY") : null;
    if (
      f.F81_060_EVENTDATETIME !== "Все" &&
      dt("F81_060_EVENTDATETIME") !== f.F81_060_EVENTDATETIME
    )
      return false;
    if (
      f.CREATE_DATETIME !== "Все" &&
      dt("CREATE_DATETIME") !== f.CREATE_DATETIME
    )
      return false;
    if (
      f.F81_070_RESTOR_SUPPLAYDATETIME !== "Все" &&
      dt("F81_070_RESTOR_SUPPLAYDATETIME") !== f.F81_070_RESTOR_SUPPLAYDATETIME
    )
      return false;
    if (
      f.F81_290_RECOVERYDATETIME !== "Все" &&
      dt("F81_290_RECOVERYDATETIME") !== f.F81_290_RECOVERYDATETIME
    )
      return false;

    return true;
  };

  return { filters, setFilters, filterOptions, applyFilters };
}
