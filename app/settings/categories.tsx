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
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import {
  categoryColorPalette,
  categoryGlyphPalette,
  findSwatch,
} from '@/lib/category-palette';
import {
  type Category,
  categories as defaultCategories,
} from '@/lib/categories';
import { useResolvedCategories, useStore } from '@/lib/store';
import type { CategoryId } from '@/lib/categories';
import { fontFamily, hitSlop, radius, space, useTheme } from '@/theme';

export default function CategoriesSettings() {
  const router = useRouter();
  const { palette, mode } = useTheme();
  const categories = useResolvedCategories();
  const {
    state,
    overrideCategory,
    resetCategory,
    reorderCategories,
    addCustomCategory,
    removeCustomCategory,
  } = useStore();

  // Inline rename state
  const [editingId, setEditingId] = useState<CategoryId | null>(null);
  const [draftLabel, setDraftLabel] = useState('');

  // Add-a-lane panel state
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGlyph, setNewGlyph] = useState<string>(categoryGlyphPalette[0]!);
  const [newColorId, setNewColorId] = useState<string>(categoryColorPalette[6]!.id); // default to Teal

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

  const handleAdd = () => {
    const name = newName.trim();
    if (name.length === 0) return;
    const swatch = findSwatch(newColorId);
    if (!swatch) return;
    const id = `custom-${Date.now()}`;
    const newCategory: Category = {
      id,
      label: name,
      glyph: newGlyph,
      color: swatch.pair,
      builtin: false,
    };
    addCustomCategory(newCategory);
    setAdding(false);
    setNewName('');
    setNewGlyph(categoryGlyphPalette[0]!);
    setNewColorId(categoryColorPalette[6]!.id);
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
            The lanes of your life. Rename, reorder, or add a new one. The first six are designed as a set; built-ins keep their colors locked but you can rename them.
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
                    color={c.color[mode]}
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
                        placeholder={original?.label ?? c.label}
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
                    {!c.builtin ? (
                      <Pressable
                        onPress={() => removeCustomCategory(c.id)}
                        hitSlop={hitSlop}
                        style={styles.arrow}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${c.label}`}
                      >
                        <Feather
                          name="x"
                          size={18}
                          color={palette.danger}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {!adding ? (
            <PressableScale
              style={[
                styles.addBtn,
                {
                  borderColor: palette.brand.primary,
                  backgroundColor: palette.bg.canvas,
                },
              ]}
              onPress={() => setAdding(true)}
              haptic={false}
            >
              <Feather
                name="plus"
                size={18}
                color={palette.brand.primary}
              />
              <Text
                variant="bodyMedium"
                style={{ color: palette.brand.primary }}
              >
                Add a lane
              </Text>
            </PressableScale>
          ) : (
            <Animated.View
              entering={FadeIn.duration(220)}
              exiting={FadeOut.duration(140)}
              style={[
                styles.addPanel,
                {
                  backgroundColor: palette.bg.surface,
                  borderColor: palette.hairline,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text variant="title">A new lane</Text>
              <Text variant="footnote" color="tertiary" style={styles.helper}>
                Pick a name, a glyph, and a color. Categories are content signal — they show on every event you assign to them.
              </Text>

              <Text variant="label" color="secondary" style={styles.fieldLabel}>
                Name
              </Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Finances, Hobbies, Reading"
                placeholderTextColor={palette.text.tertiary}
                style={[
                  styles.nameInput,
                  {
                    color: palette.text.primary,
                    borderColor: palette.hairline,
                    backgroundColor: palette.bg.canvas,
                    borderRadius: radius.md,
                  },
                ]}
                returnKeyType="next"
              />

              <Text variant="label" color="secondary" style={styles.fieldLabel}>
                Glyph
              </Text>
              <View style={styles.glyphGrid}>
                {categoryGlyphPalette.map((g) => {
                  const selected = g === newGlyph;
                  return (
                    <PressableScale
                      key={g}
                      scaleTo={0.92}
                      haptic={false}
                      onPress={() => setNewGlyph(g)}
                      style={[
                        styles.glyphCell,
                        {
                          backgroundColor: selected
                            ? palette.brand.primary
                            : palette.bg.canvas,
                          borderColor: selected
                            ? palette.brand.primary
                            : palette.hairline,
                          borderRadius: radius.md,
                        },
                      ]}
                    >
                      <Text
                        variant="headline"
                        style={{
                          color: selected
                            ? palette.text.onBrand
                            : palette.text.primary,
                          fontSize: 18,
                          lineHeight: 20,
                        }}
                      >
                        {g}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text variant="label" color="secondary" style={styles.fieldLabel}>
                Color
              </Text>
              <View style={styles.colorGrid}>
                {categoryColorPalette.map((s) => {
                  const selected = s.id === newColorId;
                  return (
                    <PressableScale
                      key={s.id}
                      scaleTo={0.9}
                      haptic={false}
                      onPress={() => setNewColorId(s.id)}
                      accessibilityRole="button"
                      accessibilityLabel={s.name}
                      style={[
                        styles.colorCell,
                        {
                          borderColor: selected
                            ? palette.text.primary
                            : palette.hairline,
                          backgroundColor: s.pair[mode],
                        },
                      ]}
                    >
                      {selected ? (
                        <Feather
                          name="check"
                          size={16}
                          color={mode === 'dark' ? '#15130F' : '#FFF'}
                        />
                      ) : null}
                    </PressableScale>
                  );
                })}
              </View>

              <View style={styles.addPanelActions}>
                <PressableScale
                  style={[
                    styles.ghostBtn,
                    { borderColor: palette.hairline },
                  ]}
                  onPress={() => {
                    setAdding(false);
                    setNewName('');
                  }}
                  haptic={false}
                >
                  <Text variant="bodyMedium" color="secondary">
                    Cancel
                  </Text>
                </PressableScale>
                <PressableScale
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: palette.brand.primary,
                      opacity: newName.trim().length === 0 ? 0.5 : 1,
                    },
                  ]}
                  onPress={handleAdd}
                  haptic={newName.trim().length > 0}
                >
                  <Text variant="bodyMedium" color="onBrand">
                    Add lane
                  </Text>
                </PressableScale>
              </View>
            </Animated.View>
          )}
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
    marginBottom: space.lg,
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
    alignItems: 'center',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    minHeight: 48,
  },
  addPanel: {
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.sm,
  },
  helper: {
    marginBottom: space.md,
  },
  fieldLabel: {
    marginTop: space.md,
    marginBottom: space.sm,
  },
  nameInput: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  glyphGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  glyphCell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorCell: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPanelActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
  },
  ghostBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
