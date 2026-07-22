import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Pill, Stat } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, radius, row, rowBetween } from '../theme';
import { useProviderStore, providerStore, type ProviderBooking } from '../store/providerStore';

const TABS = ['نظرة عامة', 'مواعيدي والأنصبة', 'الحجوزات والطلبات', 'الملف الشخصي'] as const;
const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function ConsultantDashboardScreen() {
  const nav = useNavigation<any>();
  const { profile, bookings } = useProviderStore();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('نظرة عامة');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [search, setSearch] = useState('');
  const [newSlotInput, setNewSlotInput] = useState('');
  const [newUnavailInput, setNewUnavailInput] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(bookings[0]?.id ?? null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b) => b.appointmentDate === todayStr);
  const newRequests = bookings.filter((b) => b.status === 'جديد');
  const upcomingCount = bookings.filter((b) => b.status === 'جديد' || b.status === 'مؤكد').length;
  const completedCount = bookings.filter((b) => b.status === 'مكتمل').length;
  const cancelledCount = bookings.filter((b) => b.status === 'ملغي').length;

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'الكل' || b.status === statusFilter;
    const query = search.trim().toLowerCase();
    const matchesQuery =
      !query ||
      b.applicantName.toLowerCase().includes(query) ||
      b.email.toLowerCase().includes(query) ||
      b.phone.includes(query) ||
      b.reference.toLowerCase().includes(query) ||
      b.governorate.includes(query);
    return matchesStatus && matchesQuery;
  });

  return (
    <Screen header={<AppBar title="لوحة مقدم الاستشارة" onBack={() => nav.goBack()} />}>
      {/* Demo Notice Banner */}
      <View style={[row, { backgroundColor: colors.goldSoft, borderRadius: 12, padding: 10, marginBottom: 12, gap: 8 }]}>
        <Icon name="alert-triangle" size={16} color="#B9791A" />
        <Text style={[font('700'), { flex: 1, fontSize: 11, color: '#8A5B10', textAlign: 'right' }]}>
          نسخة عرض تجريبية — لوحة تحكم مقدم الخدمة (مُحفوظة محلياً)
        </Text>
      </View>

      {/* Profile Summary Card */}
      <LinearGradient
        colors={[colors.navy800, colors.navy900]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ borderRadius: 18, padding: 16, marginBottom: 14 }}
      >
        <View style={[row, { gap: 12 }]}>
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="user" size={26} color={colors.navy700} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 16, color: '#fff' }]}>{profile.name}</Text>
            <Text style={[font('400'), { fontSize: 11, color: '#cfe', marginTop: 2 }]}>{profile.specialty}</Text>
          </View>
          <Pill label={profile.available ? 'متاح الآن' : 'غير متاح'} tone={profile.available ? 'green' : 'red'} />
        </View>
      </LinearGradient>

      {/* Main Module Selector Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', gap: 6, marginBottom: 14 }}>
        {TABS.map((t) => {
          const active = activeTab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setActiveTab(t)}
              style={[
                {
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 100,
                  backgroundColor: active ? colors.navy700 : colors.paper2,
                  borderWidth: 1,
                  borderColor: active ? colors.navy700 : colors.line,
                },
              ]}
            >
              <Text style={[font('700'), { fontSize: 11.5, color: active ? '#fff' : colors.slate }]}>{t}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* TAB A: OVERVIEW (نظرة عامة) */}
      {activeTab === 'نظرة عامة' && (
        <View style={{ gap: 14 }}>
          {/* Stats Grid */}
          <View style={[row, { gap: 8 }]}>
            <Stat icon="calendar" value={String(upcomingCount)} label="الحجوزات القادمة" />
            <Stat icon="clock" value={String(todayBookings.length)} label="مواعيد اليوم" />
            <Stat icon="alert-circle" value={String(newRequests.length)} label="طلبات جديدة" />
          </View>
          <View style={[row, { gap: 8 }]}>
            <Stat icon="check-circle" value={String(completedCount)} label="جلسات مكتملة" />
            <Stat icon="x-circle" value={String(cancelledCount)} label="حجوزات ملغاة" />
          </View>

          {/* Today's Appointments */}
          <Card>
            <View style={[rowBetween, { marginBottom: 10 }]}>
              <Pill label={`${todayBookings.length} مواعيد`} tone="navy" />
              <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>مواعيد اليوم ({todayStr})</Text>
            </View>
            {todayBookings.length === 0 ? (
              <Text style={[font('400'), { fontSize: 11.5, color: colors.muted, textAlign: 'center', marginVertical: 12 }]}>
                لا توجد مواعيد مجدولة اليوم
              </Text>
            ) : (
              todayBookings.map((b) => (
                <View key={b.id} style={{ borderTopWidth: 1, borderTopColor: colors.line2, paddingTop: 10, marginTop: 8 }}>
                  <View style={[rowBetween]}>
                    <Pill label={b.status} tone={b.status === 'مؤكد' ? 'green' : 'navy'} />
                    <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>{b.applicantName}</Text>
                  </View>
                  <Text style={[font('600'), num, { fontSize: 11, color: colors.slate, textAlign: 'right', marginTop: 4 }]}>
                    ⏰ الموعد: {b.appointmentTime} · 📍 المحافظة: {b.governorate}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </View>
      )}

      {/* TAB B: MY AVAILABILITY (مواعيدي والأنصبة) */}
      {activeTab === 'مواعيدي والأنصبة' && (
        <View style={{ gap: 14 }}>
          {/* Main Availability Switch */}
          <Card style={[rowBetween, { padding: 14 }]}>
            <Pressable
              onPress={() => providerStore.toggleAvailability()}
              style={{
                backgroundColor: profile.available ? colors.green : colors.muted,
                paddingVertical: 6,
                paddingHorizontal: 16,
                borderRadius: 100,
              }}
            >
              <Text style={[font('800'), { color: '#fff', fontSize: 12 }]}>
                {profile.available ? 'مفعّل (متاح للحجز)' : 'معطّل (مغلق مؤقتاً)'}
              </Text>
            </Pressable>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>حالة الاستقبال الحالية</Text>
              <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2 }]}>
                تحديد إمكانية ظهور مواعيدك للمستفيدين في التطبيق
              </Text>
            </View>
          </Card>

          {/* Working Days */}
          <Card style={{ padding: 14 }}>
            <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>
              أيام العمل الأسبوعية
            </Text>
            <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, textAlign: 'right', marginBottom: 10 }]}>
              انقر على اليوم لتفعيله أو إلغاء تفعيله:
            </Text>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
              {WEEKDAYS.map((day) => {
                const active = profile.availableDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => providerStore.toggleDay(day)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 100,
                      backgroundColor: active ? colors.navy700 : colors.paper2,
                      borderWidth: 1,
                      borderColor: active ? colors.navy700 : colors.line,
                    }}
                  >
                    <Text style={[font('700'), { fontSize: 11, color: active ? '#fff' : colors.slate }]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Time Slots Management */}
          <Card style={{ padding: 14 }}>
            <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>
              المواعيد والأوقات المتاحة للجلسات
            </Text>
            <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, textAlign: 'right', marginBottom: 10 }]}>
              مدة الجلسة: {profile.slotDurationMinutes} دقيقة · نطاق اليوم: {profile.startTime} إلى {profile.endTime}
            </Text>

            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {profile.slots.map((slot) => (
                <View
                  key={slot}
                  style={[row, { gap: 6, backgroundColor: colors.paper2, borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line }]}
                >
                  <Text style={[font('700'), num, { fontSize: 11, color: colors.navy700 }]}>{slot}</Text>
                  <Pressable onPress={() => providerStore.removeSlot(slot)}>
                    <Icon name="x" size={14} color={colors.red} />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Add New Slot Input */}
            <View style={[row, { gap: 8 }]}>
              <Button
                label="إضافة موعد"
                small
                onPress={() => {
                  if (newSlotInput.trim()) {
                    providerStore.addSlot(newSlotInput);
                    setNewSlotInput('');
                  }
                }}
              />
              <TextInput
                value={newSlotInput}
                onChangeText={setNewSlotInput}
                placeholder="مثال: 04:00 م"
                placeholderTextColor={colors.muted}
                style={[
                  font('600'),
                  {
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: radius.sm,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    fontSize: 12,
                    textAlign: 'right',
                    backgroundColor: '#fff',
                  },
                ]}
              />
            </View>
          </Card>

          {/* Unavailable Dates */}
          <Card style={{ padding: 14 }}>
            <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>
              تواريخ الاستثناءات والإجازات
            </Text>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {profile.unavailableDates.map((date) => (
                <View
                  key={date}
                  style={[row, { gap: 6, backgroundColor: colors.goldSoft, borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 }]}
                >
                  <Text style={[font('700'), num, { fontSize: 11, color: '#8A5B10' }]}>{date}</Text>
                  <Pressable onPress={() => providerStore.removeUnavailableDate(date)}>
                    <Icon name="x" size={14} color="#8A5B10" />
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={[row, { gap: 8 }]}>
              <Button
                label="إضافة استثناء"
                small
                onPress={() => {
                  if (newUnavailInput.trim()) {
                    providerStore.addUnavailableDate(newUnavailInput.trim());
                    setNewUnavailInput('');
                  }
                }}
              />
              <TextInput
                value={newUnavailInput}
                onChangeText={setNewUnavailInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.muted}
                style={[
                  font('600'),
                  {
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: radius.sm,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    fontSize: 12,
                    textAlign: 'right',
                    backgroundColor: '#fff',
                  },
                ]}
              />
            </View>
          </Card>
        </View>
      )}

      {/* TAB C & D: BOOKINGS & SUBMITTED FORMS (الحجوزات والطلبات ونماذج المتقدمين) */}
      {(activeTab === 'الحجوزات والطلبات' || activeTab === 'نظرة عامة') && activeTab === 'الحجوزات والطلبات' && (
        <View style={{ gap: 12 }}>
          {/* Status Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', gap: 6 }}>
            {['الكل', 'جديد', 'مؤكد', 'مكتمل', 'ملغي'].map((s) => {
              const active = statusFilter === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStatusFilter(s)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 100,
                    backgroundColor: active ? colors.navy700 : colors.paper2,
                    borderWidth: 1,
                    borderColor: active ? colors.navy700 : colors.line,
                  }}
                >
                  <Text style={[font('700'), { fontSize: 11, color: active ? '#fff' : colors.slate }]}>{s}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Search Bar */}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="بحث باسم المتقدم، البريد، الرقم..."
            placeholderTextColor={colors.muted}
            style={[
              font('600'),
              {
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.md,
                paddingVertical: 10,
                paddingHorizontal: 14,
                fontSize: 12.5,
                textAlign: 'right',
                backgroundColor: '#fff',
              },
            ]}
          />

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <Card style={{ padding: 24, alignItems: 'center' }}>
              <Icon name="inbox" size={32} color={colors.muted} />
              <Text style={[font('700'), { fontSize: 13, color: colors.slate, marginTop: 10 }]}>
                لا توجد حجوزات مطابقة للبحث
              </Text>
            </Card>
          ) : (
            filteredBookings.map((b) => {
              const isExpanded = expandedBookingId === b.id;
              return (
                <Card key={b.id} style={{ padding: 14 }}>
                  {/* Top Bar */}
                  <Pressable onPress={() => setExpandedBookingId(isExpanded ? null : b.id)} style={[rowBetween]}>
                    <Pill
                      label={b.status}
                      tone={b.status === 'مؤكد' ? 'green' : b.status === 'مكتمل' ? 'navy' : b.status === 'ملغي' ? 'red' : 'gold'}
                    />
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[font('800'), { fontSize: 14, color: colors.navy700 }]}>{b.applicantName}</Text>

                      <Text style={[font('600'), num, { fontSize: 10.5, color: colors.slate, marginTop: 2 }]}>
                        {b.consultationType} · الموعد: {b.appointmentTime} ({b.appointmentDate})
                      </Text>
                    </View>
                  </Pressable>

                  {/* Expanded Form Answers & Details */}
                  {isExpanded && (
                    <View style={{ borderTopWidth: 1, borderTopColor: colors.line2, paddingTop: 12, marginTop: 12 }}>
                      <Text style={[font('800'), { fontSize: 12, color: colors.navy700, textAlign: 'right', marginBottom: 8 }]}>
                        📋 بيانات نموذج المتقدم المرفوع
                      </Text>

                      <View style={{ gap: 6, backgroundColor: colors.paper2, padding: 10, borderRadius: 10 }}>
                        <DetailRow label="رقم المرجعية" value={b.reference} isNum />
                        <DetailRow label="البريد الإلكتروني" value={b.email} isNum />
                        <DetailRow label="الهاتف" value={b.phone} isNum />
                        {b.whatsapp ? <DetailRow label="واتساب" value={b.whatsapp} isNum /> : null}
                        <DetailRow label="العمر" value={`${b.age} سنة`} />
                        <DetailRow label="المحافظة" value={b.governorate} />
                        <DetailRow label="وسيلة التواصل المفضلة" value={b.preferredComm} />
                        <DetailRow label="تاريخ تقديم الطلب" value={b.submissionDate} isNum />
                      </View>

                      {/* General Description */}
                      <Text style={[font('700'), { fontSize: 11.5, color: colors.navy700, textAlign: 'right', marginTop: 10, marginBottom: 4 }]}>
                        الوصف العام للحالة:
                      </Text>
                      <Text style={[font('400'), { fontSize: 11, color: colors.slate, textAlign: 'right', lineHeight: 16, backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.line }]}>
                        {b.generalDescription}
                      </Text>

                      {/* Specialized Answers */}
                      {Object.keys(b.specializedAnswers).length > 0 && (
                        <View style={{ marginTop: 10 }}>
                          <Text style={[font('700'), { fontSize: 11.5, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>
                            إجابات النموذج المتخصص:
                          </Text>
                          {Object.entries(b.specializedAnswers).map(([q, ans]) => (
                            <View key={q} style={{ flexDirection: 'row-reverse', gap: 6, marginBottom: 4 }}>
                              <Text style={[font('700'), { fontSize: 10.5, color: colors.navy700 }]}>{q}:</Text>
                              <Text style={[font('400'), { fontSize: 10.5, color: colors.slate }]}>{ans}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Attachment Placeholder */}
                      {b.hasAttachment && (
                        <View style={[row, { gap: 8, marginTop: 10, backgroundColor: colors.goldSoft, padding: 8, borderRadius: 8 }]}>
                          <Icon name="file-text" size={16} color="#B9791A" />
                          <Text style={[font('600'), { flex: 1, fontSize: 10.5, color: '#8A5B10', textAlign: 'right' }]}>
                            مرفق الحالة: تم تحميل مستند/تقرير طبي سابق (معاينة تجريبية)
                          </Text>
                        </View>
                      )}

                      {/* Demo Action Buttons */}
                      <View style={[row, { gap: 6, marginTop: 14 }]}>
                        <Button
                          label="تأكيد"
                          variant="green"
                          small
                          style={{ flex: 1 }}
                          onPress={() => providerStore.updateStatus(b.id, 'مؤكد')}
                        />
                        <Button
                          label="إكمال"
                          variant="primary"
                          small
                          style={{ flex: 1 }}
                          onPress={() => providerStore.updateStatus(b.id, 'مكتمل')}
                        />
                        <Button
                          label="إلغاء"
                          variant="red"
                          small
                          style={{ flex: 1 }}
                          onPress={() => providerStore.updateStatus(b.id, 'ملغي')}
                        />
                      </View>
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* TAB E: PROFILE (الملف الشخصي) */}
      {activeTab === 'الملف الشخصي' && (
        <View style={{ gap: 14 }}>
          <Card style={{ alignItems: 'center', padding: 18 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#EAF0F8', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon name="user" size={36} color={colors.navy700} />
            </View>
            <Text style={[font('800'), { fontSize: 17, color: colors.navy700 }]}>{profile.name}</Text>
            <Text style={[font('600'), { fontSize: 12, color: colors.navy500, marginTop: 2, textAlign: 'center' }]}>{profile.specialty}</Text>
            <Text style={[font('400'), { fontSize: 11, color: colors.slate, marginTop: 8, textAlign: 'center', lineHeight: 16 }]}>
              {profile.bio}
            </Text>
          </Card>

          {/* Qualifications */}
          <Card style={{ padding: 14 }}>
            <Text style={[font('800'), { fontSize: 13, color: colors.navy700, textAlign: 'right', marginBottom: 8 }]}> المؤهلات والاعتمادات</Text>
            {profile.qualifications.map((q) => (
              <View key={q} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon name="check" size={14} color={colors.green} />
                <Text style={[font('600'), { fontSize: 11.5, color: colors.ink, textAlign: 'right' }]}>{q}</Text>
              </View>
            ))}
          </Card>

          {/* Session Types */}
          <Card style={{ padding: 14 }}>
            <Text style={[font('800'), { fontSize: 13, color: colors.navy700, textAlign: 'right', marginBottom: 8 }]}>أنواع الجلسات المعتمدة</Text>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
              {profile.sessionTypes.map((st) => (
                <Pill key={st} label={st} tone="navy" />
              ))}
            </View>
          </Card>

          {/* Contact Details */}
          <Card style={{ padding: 14 }}>
            <Text style={[font('800'), { fontSize: 13, color: colors.navy700, textAlign: 'right', marginBottom: 8 }]}>بيانات التواصل للمستشار</Text>
            <DetailRow label="رقم الهاتف" value={profile.phone} isNum />
            <DetailRow label="البريد الإلكتروني" value={profile.email} isNum />
          </Card>
        </View>
      )}

      <View style={{ height: 24 }} />
    </Screen>
  );
}

function DetailRow({ label, value, isNum }: { label: string; value: string; isNum?: boolean }) {
  return (
    <View style={[rowBetween, { marginVertical: 2 }]}>
      <Text style={[font(isNum ? '700' : '600'), isNum ? num : undefined, { fontSize: 11, color: colors.ink }]}>{value}</Text>
      <Text style={[font('600'), { fontSize: 11, color: colors.slate }]}>{label}:</Text>
    </View>
  );
}
