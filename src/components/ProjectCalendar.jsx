import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { formatDate } from '../util/dateFormat.js';
import '../css/ProjectCalendar.css';

export default function ProjectCalendar({ project, events, onSelect }) {
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 600px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 600px)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const displayEvents = useMemo(() => {
    const clean = events.map(event => ({
      ...Object.fromEntries(Object.entries(event).filter(([key]) => !['backgroundColor', 'borderColor', 'textColor'].includes(key))), allDay: true, classNames: [event.type === 'project-log' ? 'calendar-record' : 'calendar-milestone'],
    }));
    if (!compact) return clean;
    const days = new Map();
    clean.forEach(event => {
      const date = event.date;
      const day = days.get(date) || { id: `day-${date}`, date, allDay: true, type: 'project-day', logs: 0, milestones: [] };
      if (event.type === 'project-log') day.logs += 1;
      else day.milestones.push(event.type === 'project-start' ? '시작' : (project.status === 'C' ? '완료' : '중단'));
      days.set(date, day);
    });
    return [...days.values()].map(day => ({ ...day, title: day.logs ? String(day.logs) : day.milestones.join(' · '),
      classNames: ['calendar-day-summary'], extendedProps: { type: 'project-day', recordCount: day.logs, milestones: day.milestones } }));
  }, [events, compact, project.status]);

  const openEvent = info => {
    const type = info.event.extendedProps.type;
    const id = type === 'project-log' ? info.event.extendedProps.logId : type === 'project-start' ? 'created' : type === 'project-end' ? 'ended' : null;
    onSelect(info.event.startStr.split('T')[0], id);
  };

  return <>
    <div className="project-calendar-caption"><span>프로젝트 기록</span><small>{compact ? "숫자는 기록 수입니다. 날짜를 눌러 확인하세요" : "날짜를 선택하면 기록을 확인할 수 있습니다"}</small></div>
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth"
      initialDate={project.status === 'C' ? formatDate(project.created) : undefined}
      locale="ko" headerToolbar={{ left: 'title', right: 'prev,today,next' }}
      buttonText={{ today: '오늘' }} buttonHints={{ prev: '이전 달', next: '다음 달', today: '이번 달로 이동' }}
      titleFormat={{ year: 'numeric', month: 'long' }} dayHeaderFormat={{ weekday: 'short' }}
      dayCellContent={info => info.date.getDate()} fixedWeekCount={false}
      events={displayEvents} eventDisplay="block" eventInteractive displayEventTime={false}
      dayMaxEvents={compact ? 1 : 3} height="auto"
      moreLinkText={count => `+${count}개 더보기`}
      moreLinkClick={info => {
        info.jsEvent.preventDefault();
        onSelect(info.allSegs[0]?.event.startStr.split('T')[0] || formatDate(info.date), null);
        return true; // v6: a truthy non-string suppresses the default popover/view change.
      }}
      dateClick={info => onSelect(info.dateStr, null)} eventClick={openEvent}
      eventContent={info => <span className="calendar-event-label" title={info.event.title}>{info.event.title}</span>}
      eventDidMount={info => info.el.setAttribute('aria-label', info.event.extendedProps.type === 'project-day' && info.event.extendedProps.recordCount ? `${info.event.startStr}: 기록 ${info.event.extendedProps.recordCount}개 ${info.event.extendedProps.milestones.join(' · ')}` : `${info.event.startStr}: ${info.event.title}`)}
      dayCellDidMount={info => {
        const number = info.el.querySelector('.fc-daygrid-day-number');
        if (!number) return;
        const date = [info.date.getFullYear(), String(info.date.getMonth() + 1).padStart(2, '0'), String(info.date.getDate()).padStart(2, '0')].join('-');
        number.tabIndex = 0; number.setAttribute('role', 'button'); number.setAttribute('aria-label', `${date} 기록 보기`);
        number.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); selectRef.current(date, null); } });
      }}
    />
  </>;
}
