"use client";

import { create } from "zustand";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const useStatStore = create((set, get) => ({
  dateRange: null,
  selectedCity: "Все",
  selectedStatus: "Все",
  selectedMetrics: [],
  results: {},
  chartData: [],

  setDateRange: (range) => set({ dateRange: range }),
  setSelectedCity: (city) => set({ selectedCity: city }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSelectedMetrics: (metrics) => set({ selectedMetrics: metrics }),

  calculate: (incidents) => {
    const { dateRange, selectedCity, selectedStatus, selectedMetrics } = get();
    let filtered = incidents;

    if (selectedCity !== "Все") {
      filtered = filtered.filter((inc) => {
        const cityName = inc.AddressInfo?.city_district?.name?.trim() || "";
        return cityName === selectedCity;
      });
    }

    if (selectedStatus !== "Все") {
      filtered = filtered.filter(
        (inc) => inc.status_incident?.trim() === selectedStatus
      );
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const [start, end] = dateRange;
      filtered = filtered.filter((inc) => {
        const incDate = dayjs(inc.start_date, "YYYY-MM-DD");
        return incDate.isBetween(start, end, "day", "[]");
      });
    }

    const newResults = {};
    if (selectedMetrics.includes("countIncidents")) {
      newResults.countIncidents = filtered.length;
    }
    if (selectedMetrics.includes("affectedResidents")) {
      let sum = 0;
      filtered.forEach((inc) => {
        if (inc.DisruptionStats) {
          sum += parseInt(inc.DisruptionStats.affected_residents || "0", 10);
        }
      });
      newResults.affectedResidents = sum;
    }
    if (selectedMetrics.includes("affectedMkd")) {
      let sum = 0;
      filtered.forEach((inc) => {
        if (inc.DisruptionStats) {
          sum += parseInt(inc.DisruptionStats.affected_mkd || "0", 10);
        }
      });
      newResults.affectedMkd = sum;
    }
    if (selectedMetrics.includes("affectedHospitals")) {
      let sum = 0;
      filtered.forEach((inc) => {
        if (inc.DisruptionStats) {
          sum += parseInt(inc.DisruptionStats.affected_hospitals || "0", 10);
        }
      });
      newResults.affectedHospitals = sum;
    }
    if (selectedMetrics.includes("affectedClinics")) {
      let sum = 0;
      filtered.forEach((inc) => {
        if (inc.DisruptionStats) {
          sum += parseInt(inc.DisruptionStats.affected_clinics || "0", 10);
        }
      });
      newResults.affectedClinics = sum;
    }
    set({ results: newResults });

    if (
      selectedMetrics.includes("countIncidents") &&
      dateRange &&
      dateRange[0] &&
      dateRange[1]
    ) {
      const [start, end] = dateRange;
      let chartObj = {};
      let current = dayjs(start).startOf("day");
      const endDay = dayjs(end).endOf("day");
      while (current.isBefore(endDay) || current.isSame(endDay)) {
        chartObj[current.format("DD.MM.YYYY")] = 0;
        current = current.add(1, "day");
      }
      filtered.forEach((inc) => {
        const dateKey = dayjs(inc.start_date, "YYYY-MM-DD").format(
          "DD.MM.YYYY"
        );
        if (chartObj.hasOwnProperty(dateKey)) {
          chartObj[dateKey] += 1;
        }
      });
      const chartArray = Object.keys(chartObj).map((dateKey) => ({
        date: dateKey,
        count: chartObj[dateKey],
      }));
      set({ chartData: chartArray });
    } else {
      set({ chartData: [] });
    }
  },
}));

export default useStatStore;
