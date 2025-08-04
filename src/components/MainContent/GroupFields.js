export function groupFields(record) {
  const fields = Object.entries(record).filter(
    ([key, v]) =>
      !["OBJECTNAMEKEY", "SWITCHNAMEKEY", "PVS_RP116_10BR_F20"].includes(key) &&
      v &&
      typeof v === "object" &&
      "label" in v &&
      v.value !== undefined &&
      v.value !== null &&
      v.value !== ""
  );

  const mainKeys = new Set([
    "CREATE_USER",
    "fio_response_phone",
    "description",
    "F81_010_NUMBER",
    "VIOLATION_TYPE",
    "STATUS_NAME",
    "VIOLATION_GUID_STR",
    "SCNAME",
    "OWN_SCNAME",
    "DISPCENTER_NAME_",
  ]);

  const dateStatusKeys = new Set([
    "F81_060_EVENTDATETIME",
    "F81_070_RESTOR_SUPPLAYDATETIME",
    "CREATE_DATETIME",
    "F81_290_RECOVERYDATETIME",
  ]);

  const explicitResourceKeys = new Set([
    "BRIGADECOUNT",
    "EMPLOYEECOUNT",
    "SPECIALTECHNIQUECOUNT",
    "PES_COUNT",
    "need_brigade_count",
    "need_person_count",
    "need_equipment_count",
    "need_reserve_power_source_count",
  ]);

  const main = [];
  const dateStatus = [];
  const outageConsumer = [];
  const resources = [];
  const others = [];

  fields.forEach(([key, v]) => {
    if (mainKeys.has(key)) {
      main.push([key, v]);
    } else if (dateStatusKeys.has(key)) {
      dateStatus.push([key, v]);
    } else if (key.includes("ALL") || key.includes("COUNT")) {
      if (
        explicitResourceKeys.has(key) ||
        key.toLowerCase().includes("need_") ||
        key.toLowerCase().includes("_count")
      ) {
        resources.push([key, v]);
      } else {
        outageConsumer.push([key, v]);
      }
    } else if (
      explicitResourceKeys.has(key) ||
      key.toLowerCase().includes("need_") ||
      key.toLowerCase().includes("_count")
    ) {
      resources.push([key, v]);
    } else {
      others.push([key, v]);
    }
  });

  const sortByKey = (arr) => arr.sort((a, b) => a[0].localeCompare(b[0]));
  sortByKey(main);
  sortByKey(dateStatus);
  sortByKey(outageConsumer);
  sortByKey(resources);
  sortByKey(others);

  return { main, dateStatus, outageConsumer, resources, others };
}