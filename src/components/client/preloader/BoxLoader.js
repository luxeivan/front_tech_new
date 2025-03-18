"use client";
import React from "react";
import styles from "./BoxLoader.module.css";

export default function BoxLoader() {
  return (
    <div className={styles.loader}>
      <div className={styles.box1}></div>
      <div className={styles.box2}></div>
      <div className={styles.box3}></div>
    </div>
  );
}
