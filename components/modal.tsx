import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  open: boolean;
  text: string;
  title: string;
  onPress: () => void;
  onClose: () => void;
}

export default function ModalSheet({ open, onClose, text, title }: Props) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{text}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => onClose}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#17263A",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(151, 180, 211, 0.18)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F3F7FC",
    textAlign: "center",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: "#8DA1BA",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#1A2A3A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F3F7FC",
  },
});
