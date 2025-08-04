import React from "react";
import { Modal, Input } from "antd";

function SaveModal({ editing, editValue, setEditValue, onSave, onCancel }) {
  return (
    <Modal
      title={editing?.label}
      open={!!editing}
      onOk={onSave}
      onCancel={onCancel}
      okText="Сохранить"
      cancelText="Отмена"
    >
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        autoFocus
      />
    </Modal>
  );
}

export default SaveModal;
