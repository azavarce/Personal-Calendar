import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { categories as defaultCategories } from '@/lib/categories';
import { useResolvedCategories, useStore } from '@/lib/store';
import type { CategoryId } from '@/theme';
import { fontFamily, hitSlop, radius, space, useTheme } from '@/theme';

export default function CategoriesSettings() {
  const router = useRouter();
  const { palette } = useTheme();
  const categories = useResolvedCategories();
  const { state, overrideCategory, resetCategory, reorderCategories } = useStore();
  const [editingId, setEditingId] = useState<CategoryId | null>(null);
  const [draftLabel, setDraftLabel] = useState('');

  const move = (id: CategoryId, dir: -1 | 1) => {
    const idx = state.categoryOrder.indexOf(id);
    const next = idx + dir;
    if (next < 0 || next >= state.categoryOrder.length) return;
    const order = [...state.categoryOrder];
    [order[idx], order[next]] = [order[next]!, order[idx]!];
    reorderCategories(order);
  };

  const startEdit = (id: CategoryId, currentLabel: string) => {
    setEditingId(id);
    setDraftLabel(currentLabel);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    const trimmed = draftLabel.trim();
    if (trimmed.length === 0) {
      setEditingId(null);
      return;
    }
    const original = defaultCategories.find((c) => c.id === editingId);
    if (original && original.label === trimmed) {
      // Reset override if user typed the original label back.
      resetCategory(editingId);
    } else {
      overrideCategory(editingId, { label: trimmed });
    }
    setEditingId(null);
  };

  const isOverridden = (id: CategoryId) =>
    Boolean(state.categoryOverrides[id]?.label);

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.root, { backgroundColor: palette.bg.canvas }]}
    >
      <View style={styles.topbar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.topbarBtn}
        >
          <Feather
            name="chevron-left"
            size={22}
            color={palette.text.secondary}
          />
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text variant="display">Categories</Text>
          <Text variant="footnote" color="tertiary" style={styles.subtitle}>
            Six lanes of your life. Rename them, reorder them. The colors and shapes are designed as a set; we keep those locked for now.
          </Text>

          <View style={styles.list}>
            {categories.map((c, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === categories.length - 1;
              const original = defaultCategories.find((d) => d.id === c.id);
              const overridden = isOverridden(c.id);

              return (
                <View
                  key={c.id}
                  style={[
                    styles.row,
                    {
                      backgroundColor: palette.bg.surface,
                      borderColor: palette.hairline,
                      borderRadius: radius.lg,
                    },
                  ]}
                >
                  <Text
                    variant="headline"
                    color={palette.category[c.id]}
                    style={styles.rowGlyph}
                  >
                    {c.glyph}
                  </Text>

                  {editingId === c.id ? (
                    <View style={styles.editArea}>
                      <TextInput
                        value={draftLabel}
                        onChangeText={setDraftLabel}
                        onSubmitEditing={saveEdit}
                        onBlur={saveEdit}
                        autoFocus
                        placeholder={original?.label}
                        placeholderTextColor={palette.text.tertiary}
                        style={[
                          styles.editInput,
                          {
                            color: palette.text.primary,
                            borderBottomColor: palette.brand.primary,
                          },
                        ]}
                        returnKeyType="done"
                      />
                    </View>
                  ) : (
                    <PressableScale
                      style={styles.labelArea}
                      onPress={() => startEdit(c.id, c.label)}
                      haptic={false}
                      accessibilityRole="button"
                      accessibilityLabel={`Rename ${c.label}`}
                    >
                      <Text variant="title">{c.label}</Text>
                      {overridden && original ? (
                        <Text variant="footnote" color="tertiary" style={styles.original}>
                          Originally "{original.label}"
                        </Text>
                      ) : null}
                    </PressableScale>
                  )}

                  <View style={styles.controls}>
                    <Pressable
                      onPress={() => move(c.id, -1)}
                      disabled={isFirst}
                      hitSlop={hitSlop}
                      style={[styles.arrow, isFirst && styles.arrowDisabled]}
                      accessibilityRole="button"
                      accessibilityLabel="Move up"
                      accessibilityState={{ disabled: isFirst }}
                    >
                      <Feather
                        name="chevron-up"
                        size={18}
                        color={
                          isFirst
                            ? palette.text.tertiary
                            : palette.text.secondary
                        }
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => move(c.id, 1)}
                      disabled={isLast}
                      hitSlop={hitSlop}
                      style={[styles.arrow, isLast && styles.arrowDisabled]}
                      accessibilityRole="button"
                      accessibilityLabel="Move down"
                      accessibilityState={{ disabled: isLast }}
                    >
                      <Feather
                        name="chevron-down"
                        size={18}
                        color={
                          isLast
                            ? palette.text.tertiary
                            : palette.text.secondary
                        }
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
  },
  topbarBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: space.md,
    paddingBottom: space['3xl'],
  },
  subtitle: {
    marginTop: 4,
    marginBottom: space.xl,
  },
  list: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.md,
    minHeight: 64,
  },
  rowGlyph: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  labelArea: {
    flex: 1,
  },
  original: {
    marginTop: 2,
  },
  editArea: {
    flex: 1,
  },
  editInput: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 17,
    paddingVertical: 6,
    borderBottomWidth: 1.5,
  },
  controls: {
    flexDirection: 'row',
    gap: 4,
  },
  arrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  arrowDisabled: {
    opacity: 0.4,
  },
});
