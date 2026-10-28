// 무협·선협 창작 이름용 한자 음절 풀. 실존 인물 명단이 아니라 장르 관습에 맞춘 조합용 재료다.
// 성씨는 실재하는 중국계 성(복성 포함)에서 골랐다.
// ko = 단어 첫머리가 아닐 때의 음(본음), initial = 두음법칙이 적용되는 첫머리 음(다를 때만).
// 예) 蓮: ko '련', initial '연' → 이름 첫 글자면 '연', 둘째 글자면 '련'.
// 律·烈처럼 모음·ㄴ 받침 뒤에서 '율·열'이 되는 음절은 ko에 본음(률·렬)을 두었다(엔진에서 처리).
// '지·위·병·발·귀·애·로·등' 음절은 성·다른 음절과 붙어 비속어·어색한 낱말(황보+지…, 자+위…, 사마+귀…)이 되기 쉬워 넣지 않았다.

import type { Mood } from '../types';

// hun = 훈(뜻), shown with the reading as 「白 흰 백」.
export interface HanjaSyl extends Mood { ko: string; hanja: string; g: 'm' | 'f' | 'u'; initial?: string; hun?: string }
export interface HanjaSurname { ko: string; hanja: string; initial?: string; hun?: string }
export interface HanjaPools { surnames: HanjaSurname[]; given: HanjaSyl[] }

export const MURIM: HanjaPools = {
  surnames: [
    { ko: '남궁', hanja: '南宮', hun: '남녘 · 집' }, { ko: '제갈', hanja: '諸葛', hun: '모두 · 칡' }, { ko: '모용', hanja: '慕容', hun: '그릴 · 얼굴' }, { ko: '독고', hanja: '獨孤', hun: '홀로 · 외로울' },
    { ko: '사마', hanja: '司馬', hun: '맡을 · 말' }, { ko: '황보', hanja: '皇甫', hun: '임금 · 클' }, { ko: '상관', hanja: '上官', hun: '윗 · 벼슬' }, { ko: '동방', hanja: '東方', hun: '동녘 · 모' },
    { ko: '서문', hanja: '西門', hun: '서녘 · 문' }, { ko: '하후', hanja: '夏侯', hun: '여름 · 제후' }, { ko: '영호', hanja: '令狐', hun: '하여금 · 여우' }, { ko: '구양', hanja: '歐陽', hun: '구라파 · 볕' },
    { ko: '공손', hanja: '公孫', hun: '공평할 · 손자' }, { ko: '우문', hanja: '宇文', hun: '집 · 글월' }, { ko: '혁련', hanja: '赫連', hun: '빛날 · 이을' }, { ko: '종리', hanja: '鍾離', hun: '쇠북 · 떠날' },
    { ko: '위지', hanja: '尉遲', hun: '벼슬 · 더딜' }, { ko: '단목', hanja: '端木', hun: '끝 · 나무' }, { ko: '장손', hanja: '長孫', hun: '긴 · 손자' }, { ko: '사도', hanja: '司徒', hun: '맡을 · 무리' },
    { ko: '헌원', hanja: '軒轅', hun: '집 · 끌채' }, { ko: '백리', hanja: '百里', hun: '일백 · 마을' },
    { ko: '당', hanja: '唐', hun: '당나라' }, { ko: '백', hanja: '白', hun: '흰' }, { ko: '진', hanja: '陳', hun: '베풀' }, { ko: '단', hanja: '段', hun: '층계' },
    { ko: '팽', hanja: '彭', hun: '성' }, { ko: '악', hanja: '岳', hun: '큰산' }, { ko: '양', hanja: '楊', hun: '버들' }, { ko: '뇌', hanja: '雷', hun: '우레' },
    { ko: '용', hanja: '龍', hun: '용' }, { ko: '연', hanja: '燕', hun: '제비' }, { ko: '냉', hanja: '冷', hun: '찰' }, { ko: '엽', hanja: '葉', hun: '잎' },
    { ko: '황', hanja: '黃', hun: '누를' }, { ko: '한', hanja: '韓', hun: '한국' }, { ko: '조', hanja: '趙', hun: '나라' }, { ko: '손', hanja: '孫', hun: '손자' },
    { ko: '방', hanja: '方', hun: '모' }, { ko: '유', hanja: '柳', hun: '버들' }, { ko: '막', hanja: '莫', hun: '없을' }, { ko: '소', hanja: '蕭', hun: '쓸쓸할' },
    { ko: '능', hanja: '凌', hun: '업신여길' }, { ko: '교', hanja: '喬', hun: '높을' }, { ko: '석', hanja: '石', hun: '돌' }, { ko: '곽', hanja: '霍', hun: '빠를' },
    { ko: '관', hanja: '關', hun: '관계할' }, { ko: '적', hanja: '狄', hun: '오랑캐' }, { ko: '낙', hanja: '駱', hun: '낙타' },
  ],
  given: [
    // 남성적·무인풍
    { ko: '무', hanja: '武', g: 'm', hun: '호반', era: 'c', tone: 'h', flair: 'p' }, { ko: '천', hanja: '天', g: 'm', hun: '하늘', era: 'c', tone: 'h', flair: 'f' }, { ko: '호', hanja: '虎', g: 'm', hun: '범', era: 'c', tone: 'h', flair: 'f' },
    { ko: '렬', hanja: '烈', g: 'm', initial: '열', hun: '매울', era: 'c', tone: 'h', flair: 'f' }, { ko: '풍', hanja: '風', g: 'm', hun: '바람', era: 'c', tone: 's', flair: 'f' }, { ko: '현', hanja: '玄', g: 'm', hun: '검을', era: 'c', tone: 'h', flair: 'f' },
    { ko: '하', hanja: '河', g: 'm', hun: '물', era: 'm', tone: 's', flair: 'p' }, { ko: '검', hanja: '劍', g: 'm', hun: '칼', era: 'c', tone: 'h', flair: 'f' }, { ko: '강', hanja: '剛', g: 'm', hun: '굳셀', era: 'c', tone: 'h', flair: 'p' },
    { ko: '철', hanja: '鐵', g: 'm', hun: '쇠', era: 'c', tone: 'h', flair: 'p' }, { ko: '산', hanja: '山', g: 'm', hun: '메', era: 'c', tone: 'h', flair: 'p' }, { ko: '악', hanja: '岳', g: 'm', hun: '큰산', era: 'c', tone: 'h', flair: 'p' },
    { ko: '웅', hanja: '雄', g: 'm', hun: '수컷', era: 'c', tone: 'h', flair: 'p' }, { ko: '용', hanja: '勇', g: 'm', hun: '날랠', era: 'c', tone: 'h', flair: 'p' }, { ko: '룡', hanja: '龍', g: 'm', initial: '용', hun: '용', era: 'c', tone: 'h', flair: 'f' },
    { ko: '진', hanja: '振', g: 'm', hun: '떨칠', era: 'c', tone: 'h', flair: 'p' }, { ko: '혁', hanja: '赫', g: 'm', hun: '빛날', era: 'm', tone: 'h', flair: 'f' }, { ko: '패', hanja: '霸', g: 'm', hun: '으뜸', era: 'c', tone: 'h', flair: 'f' },
    { ko: '맹', hanja: '猛', g: 'm', hun: '사나울', era: 'c', tone: 'h', flair: 'p' }, { ko: '랑', hanja: '狼', g: 'm', initial: '낭', hun: '이리', era: 'c', tone: 'h', flair: 'f' }, { ko: '응', hanja: '鷹', g: 'm', hun: '매', era: 'c', tone: 'h', flair: 'f' },
    { ko: '소', hanja: '嘯', g: 'm', hun: '휘파람', era: 'c', tone: 'h', flair: 'f' }, { ko: '봉', hanja: '鋒', g: 'm', hun: '칼날', era: 'c', tone: 'h', flair: 'f' }, { ko: '도', hanja: '刀', g: 'm', hun: '칼', era: 'c', tone: 'h', flair: 'p' },
    { ko: '창', hanja: '槍', g: 'm', hun: '창', era: 'c', tone: 'h', flair: 'p' }, { ko: '권', hanja: '拳', g: 'm', hun: '주먹', era: 'c', tone: 'h', flair: 'p' }, { ko: '뢰', hanja: '雷', g: 'm', initial: '뇌', hun: '우레', era: 'c', tone: 'h', flair: 'f' },
    { ko: '정', hanja: '霆', g: 'm', hun: '천둥소리', era: 'c', tone: 'h', flair: 'f' }, { ko: '염', hanja: '炎', g: 'm', hun: '불꽃', era: 'c', tone: 'h', flair: 'f' }, { ko: '엄', hanja: '嚴', g: 'm', hun: '엄할', era: 'c', tone: 'h', flair: 'p' },
    { ko: '석', hanja: '石', g: 'm', hun: '돌', era: 'c', tone: 'h', flair: 'p' }, { ko: '해', hanja: '海', g: 'm', hun: '바다', era: 'm', tone: 's', flair: 'p' }, { ko: '파', hanja: '波', g: 'm', hun: '물결', era: 'c', tone: 's', flair: 'p' },
    { ko: '광', hanja: '光', g: 'm', hun: '빛', era: 'm', tone: 'h', flair: 'p' }, { ko: '휘', hanja: '輝', g: 'm', hun: '빛날', era: 'm', tone: 's', flair: 'f' }, { ko: '양', hanja: '陽', g: 'm', hun: '볕', era: 'm', tone: 's', flair: 'p' },
    { ko: '동', hanja: '東', g: 'm', hun: '동녘', era: 'm', tone: 'h', flair: 'p' }, { ko: '북', hanja: '北', g: 'm', hun: '북녘', era: 'c', tone: 'h', flair: 'p' }, { ko: '남', hanja: '南', g: 'm', hun: '남녘', era: 'c', tone: 's', flair: 'p' },
    { ko: '충', hanja: '忠', g: 'm', hun: '충성', era: 'c', tone: 'h', flair: 'p' }, { ko: '인', hanja: '仁', g: 'm', hun: '어질', era: 'm', tone: 's', flair: 'p' }, { ko: '덕', hanja: '德', g: 'm', hun: '큰', era: 'c', tone: 's', flair: 'p' },
    { ko: '일', hanja: '一', g: 'm', hun: '한', era: 'c', tone: 'h', flair: 'p' }, { ko: '만', hanja: '萬', g: 'm', hun: '일만', era: 'c', tone: 'h', flair: 'p' }, { ko: '경', hanja: '勁', g: 'm', hun: '굳셀', era: 'c', tone: 'h', flair: 'p' },
    { ko: '원', hanja: '遠', g: 'm', hun: '멀', era: 'm', tone: 's', flair: 'p' }, { ko: '준', hanja: '俊', g: 'm', hun: '준걸', era: 'm', tone: 'h', flair: 'p' }, { ko: '걸', hanja: '傑', g: 'm', hun: '뛰어날', era: 'c', tone: 'h', flair: 'f' },
    { ko: '책', hanja: '策', g: 'm', hun: '꾀', era: 'c', tone: 'h', flair: 'p' }, { ko: '항', hanja: '恒', g: 'm', hun: '항상', era: 'm', tone: 's', flair: 'p' }, { ko: '견', hanja: '堅', g: 'm', hun: '굳을', era: 'c', tone: 'h', flair: 'p' },
    { ko: '극', hanja: '極', g: 'm', hun: '다할', era: 'c', tone: 'h', flair: 'f' }, { ko: '태', hanja: '泰', g: 'm', hun: '클', era: 'm', tone: 'h', flair: 'p' }, { ko: '건', hanja: '乾', g: 'm', hun: '하늘', era: 'c', tone: 'h', flair: 'f' },
    { ko: '곤', hanja: '崑', g: 'm', hun: '산 이름', era: 'c', tone: 'h', flair: 'f' }, { ko: '중', hanja: '重', g: 'm', hun: '무거울', era: 'c', tone: 'h', flair: 'p' }, { ko: '표', hanja: '彪', g: 'm', hun: '범', era: 'c', tone: 'h', flair: 'f' },
    { ko: '굉', hanja: '宏', g: 'm', hun: '클', era: 'c', tone: 'h', flair: 'p' }, { ko: '탁', hanja: '卓', g: 'm', hun: '높을', era: 'c', tone: 'h', flair: 'p' }, { ko: '쾌', hanja: '快', g: 'm', hun: '쾌할', era: 'c', tone: 'h', flair: 'p' },
    { ko: '열', hanja: '悅', g: 'm', hun: '기쁠', era: 'c', tone: 's', flair: 'p' }, { ko: '혼', hanja: '魂', g: 'm', hun: '넋', era: 'c', tone: 'h', flair: 'f' }, { ko: '겸', hanja: '謙', g: 'm', hun: '겸손할', era: 'm', tone: 's', flair: 'p' },
    // 공용
    { ko: '운', hanja: '雲', g: 'u', hun: '구름', era: 'c', tone: 's', flair: 'f' }, { ko: '백', hanja: '白', g: 'u', hun: '흰', era: 'c', tone: 's', flair: 'f' }, { ko: '성', hanja: '星', g: 'u', hun: '별', era: 'm', tone: 's', flair: 'f' },
    { ko: '명', hanja: '明', g: 'u', hun: '밝을', era: 'm', tone: 's', flair: 'p' }, { ko: '정', hanja: '正', g: 'u', hun: '바를', era: 'm', tone: 'h', flair: 'p' }, { ko: '의', hanja: '義', g: 'u', hun: '옳을', era: 'c', tone: 'h', flair: 'p' },
    { ko: '영', hanja: '英', g: 'u', hun: '꽃부리', era: 'm', tone: 's', flair: 'p' }, { ko: '수', hanja: '秀', g: 'u', hun: '빼어날', era: 'm', tone: 's', flair: 'p' }, { ko: '문', hanja: '文', g: 'u', hun: '글월', era: 'm', tone: 's', flair: 'p' },
    { ko: '서', hanja: '書', g: 'u', hun: '글', era: 'm', tone: 's', flair: 'p' }, { ko: '청', hanja: '淸', g: 'u', hun: '맑을', era: 'c', tone: 's', flair: 'f' }, { ko: '한', hanja: '寒', g: 'u', hun: '찰', era: 'c', tone: 'h', flair: 'f' },
    { ko: '무', hanja: '舞', g: 'u', hun: '춤출', era: 'c', tone: 's', flair: 'f' }, { ko: '심', hanja: '心', g: 'u', hun: '마음', era: 'm', tone: 's', flair: 'p' }, { ko: '영', hanja: '影', g: 'u', hun: '그림자', era: 'c', tone: 'h', flair: 'f' },
    { ko: '연', hanja: '然', g: 'u', hun: '그럴', era: 'm', tone: 's', flair: 'p' }, { ko: '현', hanja: '賢', g: 'u', hun: '어질', era: 'm', tone: 's', flair: 'p' }, { ko: '진', hanja: '眞', g: 'u', hun: '참', era: 'm', tone: 's', flair: 'p' },
    { ko: '율', hanja: '聿', g: 'u', hun: '붓', era: 'm', tone: 's', flair: 'f' }, { ko: '담', hanja: '潭', g: 'u', hun: '못', era: 'c', tone: 's', flair: 'p' }, { ko: '선', hanja: '善', g: 'u', hun: '착할', era: 'm', tone: 's', flair: 'p' },
    { ko: '빙', hanja: '冰', g: 'u', hun: '얼음', era: 'c', tone: 'h', flair: 'f' }, { ko: '추', hanja: '秋', g: 'u', hun: '가을', era: 'm', tone: 's', flair: 'p' }, { ko: '상', hanja: '霜', g: 'u', hun: '서리', era: 'c', tone: 'h', flair: 'f' },
    // 여성적
    { ko: '화', hanja: '花', g: 'f', hun: '꽃', era: 'c', tone: 's', flair: 'p' }, { ko: '련', hanja: '蓮', g: 'f', initial: '연', hun: '연꽃', era: 'c', tone: 's', flair: 'f' }, { ko: '월', hanja: '月', g: 'f', hun: '달', era: 'c', tone: 's', flair: 'f' },
    { ko: '설', hanja: '雪', g: 'f', hun: '눈', era: 'c', tone: 's', flair: 'f' }, { ko: '향', hanja: '香', g: 'f', hun: '향기', era: 'c', tone: 's', flair: 'p' }, { ko: '란', hanja: '蘭', g: 'f', initial: '난', hun: '난초', era: 'c', tone: 's', flair: 'f' },
    { ko: '매', hanja: '梅', g: 'f', hun: '매화', era: 'c', tone: 's', flair: 'p' }, { ko: '류', hanja: '柳', g: 'f', initial: '유', hun: '버들', era: 'c', tone: 's', flair: 'p' }, { ko: '연', hanja: '燕', g: 'f', hun: '제비', era: 'c', tone: 's', flair: 'f' },
    { ko: '앵', hanja: '鶯', g: 'f', hun: '꾀꼬리', era: 'c', tone: 's', flair: 'f' }, { ko: '황', hanja: '凰', g: 'f', hun: '봉황', era: 'c', tone: 'h', flair: 'f' }, { ko: '옥', hanja: '玉', g: 'f', hun: '구슬', era: 'c', tone: 's', flair: 'p' },
    { ko: '주', hanja: '珠', g: 'f', hun: '구슬', era: 'm', tone: 's', flair: 'p' }, { ko: '요', hanja: '瑤', g: 'f', hun: '아름다운 옥', era: 'c', tone: 's', flair: 'f' }, { ko: '림', hanja: '琳', g: 'f', initial: '임', hun: '아름다운 옥', era: 'm', tone: 's', flair: 'f' },
    { ko: '금', hanja: '琴', g: 'f', hun: '거문고', era: 'c', tone: 's', flair: 'f' }, { ko: '슬', hanja: '瑟', g: 'f', hun: '큰 거문고', era: 'c', tone: 's', flair: 'f' }, { ko: '소', hanja: '素', g: 'f', hun: '본디', era: 'm', tone: 's', flair: 'p' },
    { ko: '완', hanja: '婉', g: 'f', hun: '순할', era: 'c', tone: 's', flair: 'p' }, { ko: '언', hanja: '嫣', g: 'f', hun: '아름다울', era: 'c', tone: 's', flair: 'f' }, { ko: '경', hanja: '瓊', g: 'f', hun: '구슬', era: 'c', tone: 's', flair: 'f' },
    { ko: '아', hanja: '娥', g: 'f', hun: '예쁠', era: 'm', tone: 's', flair: 'p' }, { ko: '희', hanja: '姬', g: 'f', hun: '아가씨', era: 'c', tone: 's', flair: 'p' }, { ko: '연', hanja: '姸', g: 'f', hun: '고울', era: 'm', tone: 's', flair: 'p' },
    { ko: '려', hanja: '麗', g: 'f', initial: '여', hun: '고울', era: 'c', tone: 's', flair: 'f' }, { ko: '화', hanja: '華', g: 'f', hun: '빛날', era: 'c', tone: 's', flair: 'f' }, { ko: '방', hanja: '芳', g: 'f', hun: '꽃다울', era: 'c', tone: 's', flair: 'p' },
    { ko: '비', hanja: '菲', g: 'f', hun: '엷을', era: 'c', tone: 's', flair: 'f' }, { ko: '접', hanja: '蝶', g: 'f', hun: '나비', era: 'c', tone: 's', flair: 'f' }, { ko: '하', hanja: '霞', g: 'f', hun: '노을', era: 'c', tone: 's', flair: 'f' },
    { ko: '홍', hanja: '紅', g: 'f', hun: '붉을', era: 'c', tone: 'h', flair: 'f' }, { ko: '취', hanja: '翠', g: 'f', hun: '푸를', era: 'c', tone: 's', flair: 'f' }, { ko: '벽', hanja: '碧', g: 'f', hun: '푸를', era: 'c', tone: 'h', flair: 'f' },
    { ko: '은', hanja: '銀', g: 'f', hun: '은', era: 'm', tone: 's', flair: 'f' }, { ko: '령', hanja: '鈴', g: 'f', initial: '영', hun: '방울', era: 'm', tone: 's', flair: 'p' }, { ko: '령', hanja: '玲', g: 'f', initial: '영', hun: '옥소리', era: 'm', tone: 's', flair: 'f' },
    { ko: '가', hanja: '歌', g: 'f', hun: '노래', era: 'm', tone: 's', flair: 'p' }, { ko: '몽', hanja: '夢', g: 'f', hun: '꿈', era: 'm', tone: 's', flair: 'f' }, { ko: '정', hanja: '情', g: 'f', hun: '뜻', era: 'c', tone: 's', flair: 'p' },
    { ko: '유', hanja: '柔', g: 'f', hun: '부드러울', era: 'm', tone: 's', flair: 'p' }, { ko: '상', hanja: '湘', g: 'f', hun: '강 이름', era: 'c', tone: 's', flair: 'p' }, { ko: '응', hanja: '凝', g: 'f', hun: '엉길', era: 'c', tone: 'h', flair: 'p' },
    { ko: '청', hanja: '晴', g: 'f', hun: '갤', era: 'm', tone: 's', flair: 'p' }, { ko: '기', hanja: '綺', g: 'f', hun: '비단', era: 'c', tone: 's', flair: 'f' }, { ko: '금', hanja: '錦', g: 'f', hun: '비단', era: 'c', tone: 's', flair: 'f' },
    { ko: '수', hanja: '繡', g: 'f', hun: '수놓을', era: 'c', tone: 's', flair: 'p' }, { ko: '우', hanja: '羽', g: 'f', hun: '깃', era: 'm', tone: 's', flair: 'f' }, { ko: '혜', hanja: '惠', g: 'f', hun: '은혜', era: 'm', tone: 's', flair: 'p' },
    { ko: '미', hanja: '薇', g: 'f', hun: '장미', era: 'm', tone: 's', flair: 'f' }, { ko: '단', hanja: '丹', g: 'f', hun: '붉을', era: 'c', tone: 'h', flair: 'p' }, { ko: '진', hanja: '珍', g: 'f', hun: '보배', era: 'm', tone: 's', flair: 'p' },
  ],
};

export const XIANXIA: HanjaPools = {
  surnames: [
    { ko: '운', hanja: '雲', hun: '구름' }, { ko: '백', hanja: '白', hun: '흰' }, { ko: '심', hanja: '沈', hun: '잠길' }, { ko: '사', hanja: '謝', hun: '사례할' },
    { ko: '고', hanja: '顧', hun: '돌아볼' }, { ko: '소', hanja: '蕭', hun: '쓸쓸할' }, { ko: '엽', hanja: '葉', hun: '잎' }, { ko: '초', hanja: '楚', hun: '초나라' },
    { ko: '강', hanja: '江', hun: '강' }, { ko: '낙', hanja: '洛', hun: '물 이름' }, { ko: '봉', hanja: '鳳', hun: '봉새' }, { ko: '월', hanja: '月', hun: '달' },
    { ko: '화', hanja: '花', hun: '꽃' }, { ko: '설', hanja: '薛', hun: '성' }, { ko: '임', hanja: '林', hun: '수풀' }, { ko: '송', hanja: '宋', hun: '송나라' },
    { ko: '진', hanja: '秦', hun: '진나라' }, { ko: '육', hanja: '陸', hun: '뭍' }, { ko: '안', hanja: '晏', hun: '늦을' }, { ko: '온', hanja: '溫', hun: '따뜻할' },
    { ko: '묵', hanja: '墨', hun: '먹' }, { ko: '영', hanja: '寧', hun: '편안' }, { ko: '능', hanja: '凌', hun: '업신여길' }, { ko: '계', hanja: '季', hun: '계절' },
    { ko: '배', hanja: '裴', hun: '성' }, { ko: '연', hanja: '燕', hun: '제비' }, { ko: '유', hanja: '柳', hun: '버들' }, { ko: '군', hanja: '君', hun: '임금' },
    { ko: '옥', hanja: '玉', hun: '구슬' }, { ko: '냉', hanja: '冷', hun: '찰' }, { ko: '교', hanja: '喬', hun: '높을' }, { ko: '하', hanja: '賀', hun: '하례할' },
    { ko: '기', hanja: '紀', hun: '벼리' }, { ko: '용', hanja: '容', hun: '얼굴' }, { ko: '수', hanja: '水', hun: '물' },
    { ko: '모용', hanja: '慕容', hun: '그릴 · 얼굴' }, { ko: '상관', hanja: '上官', hun: '윗 · 벼슬' }, { ko: '동방', hanja: '東方', hun: '동녘 · 모' }, { ko: '남궁', hanja: '南宮', hun: '남녘 · 집' },
    { ko: '사공', hanja: '司空', hun: '맡을 · 빌' }, { ko: '백리', hanja: '百里', hun: '일백 · 마을' }, { ko: '하후', hanja: '夏侯', hun: '여름 · 제후' }, { ko: '영호', hanja: '令狐', hun: '하여금 · 여우' },
    { ko: '황보', hanja: '皇甫', hun: '임금 · 클' }, { ko: '헌원', hanja: '軒轅', hun: '집 · 끌채' }, { ko: '태숙', hanja: '太叔', hun: '클 · 아재비' }, { ko: '담대', hanja: '澹臺', hun: '맑을 · 대' },
  ],
  given: [
    // 남성적·청아한 선인풍
    { ko: '호', hanja: '昊', g: 'm', hun: '하늘', era: 'c', tone: 's', flair: 'f' }, { ko: '희', hanja: '曦', g: 'm', hun: '햇빛', era: 'c', tone: 's', flair: 'f' }, { ko: '진', hanja: '辰', g: 'm', hun: '별', era: 'c', tone: 's', flair: 'f' },
    { ko: '현', hanja: '玄', g: 'm', hun: '검을', era: 'c', tone: 'h', flair: 'f' }, { ko: '소', hanja: '霄', g: 'm', hun: '하늘', era: 'c', tone: 's', flair: 'f' }, { ko: '신', hanja: '宸', g: 'm', hun: '대궐', era: 'c', tone: 'h', flair: 'f' },
    { ko: '란', hanja: '瀾', g: 'm', initial: '난', hun: '물결', era: 'c', tone: 's', flair: 'f' }, { ko: '철', hanja: '澈', g: 'm', hun: '맑을', era: 'm', tone: 's', flair: 'f' }, { ko: '욱', hanja: '煜', g: 'm', hun: '빛날', era: 'm', tone: 'h', flair: 'f' },
    { ko: '성', hanja: '晟', g: 'm', hun: '밝을', era: 'm', tone: 'h', flair: 'p' }, { ko: '연', hanja: '衍', g: 'm', hun: '넓을', era: 'c', tone: 's', flair: 'p' }, { ko: '형', hanja: '珩', g: 'm', hun: '노리개', era: 'c', tone: 'h', flair: 'f' },
    { ko: '근', hanja: '瑾', g: 'm', hun: '아름다운 옥', era: 'c', tone: 's', flair: 'f' }, { ko: '경', hanja: '璟', g: 'm', hun: '옥빛', era: 'm', tone: 's', flair: 'f' }, { ko: '익', hanja: '翊', g: 'm', hun: '도울', era: 'c', tone: 'h', flair: 'f' },
    { ko: '묵', hanja: '墨', g: 'm', hun: '먹', era: 'c', tone: 'h', flair: 'f' }, { ko: '야', hanja: '夜', g: 'm', hun: '밤', era: 'c', tone: 'h', flair: 'f' }, { ko: '릉', hanja: '凌', g: 'm', initial: '능', hun: '업신여길', era: 'c', tone: 'h', flair: 'f' },
    { ko: '잠', hanja: '岑', g: 'm', hun: '봉우리', era: 'c', tone: 'h', flair: 'p' }, { ko: '준', hanja: '峻', g: 'm', hun: '높을', era: 'm', tone: 'h', flair: 'p' }, { ko: '주', hanja: '舟', g: 'm', hun: '배', era: 'c', tone: 's', flair: 'p' },
    { ko: '균', hanja: '鈞', g: 'm', hun: '서른 근', era: 'c', tone: 'h', flair: 'p' }, { ko: '천', hanja: '天', g: 'm', hun: '하늘', era: 'c', tone: 'h', flair: 'f' }, { ko: '택', hanja: '澤', g: 'm', hun: '못', era: 'm', tone: 's', flair: 'p' },
    { ko: '혁', hanja: '弈', g: 'm', hun: '바둑', era: 'c', tone: 'h', flair: 'f' }, { ko: '승', hanja: '承', g: 'm', hun: '이을', era: 'm', tone: 'h', flair: 'p' }, { ko: '윤', hanja: '允', g: 'm', hun: '맏', era: 'm', tone: 's', flair: 'p' },
    { ko: '명', hanja: '銘', g: 'm', hun: '새길', era: 'c', tone: 'h', flair: 'p' }, { ko: '쟁', hanja: '崢', g: 'm', hun: '가파를', era: 'c', tone: 'h', flair: 'f' }, { ko: '각', hanja: '珏', g: 'm', hun: '쌍옥', era: 'c', tone: 'h', flair: 'f' },
    { ko: '침', hanja: '琛', g: 'm', hun: '보배', era: 'c', tone: 's', flair: 'f' }, { ko: '원', hanja: '遠', g: 'm', hun: '멀', era: 'm', tone: 's', flair: 'p' }, { ko: '역', hanja: '亦', g: 'm', hun: '또', era: 'c', tone: 's', flair: 'p' },
    { ko: '수', hanja: '修', g: 'm', hun: '닦을', era: 'm', tone: 's', flair: 'p' }, { ko: '겸', hanja: '謙', g: 'm', hun: '겸손할', era: 'm', tone: 's', flair: 'p' }, { ko: '기', hanja: '祁', g: 'm', hun: '성할', era: 'c', tone: 'h', flair: 'p' },
    { ko: '건', hanja: '乾', g: 'm', hun: '하늘', era: 'c', tone: 'h', flair: 'f' }, { ko: '곤', hanja: '坤', g: 'm', hun: '땅', era: 'c', tone: 'h', flair: 'p' }, { ko: '정', hanja: '霆', g: 'm', hun: '천둥소리', era: 'c', tone: 'h', flair: 'f' },
    { ko: '휘', hanja: '徽', g: 'm', hun: '아름다울', era: 'c', tone: 's', flair: 'f' }, { ko: '엽', hanja: '燁', g: 'm', hun: '빛날', era: 'c', tone: 'h', flair: 'f' }, { ko: '황', hanja: '晃', g: 'm', hun: '밝을', era: 'c', tone: 'h', flair: 'p' },
    { ko: '오', hanja: '悟', g: 'm', hun: '깨달을', era: 'c', tone: 's', flair: 'p' }, { ko: '도', hanja: '道', g: 'm', hun: '길', era: 'c', tone: 'h', flair: 'p' }, { ko: '청', hanja: '靑', g: 'm', hun: '푸를', era: 'c', tone: 's', flair: 'p' },
    { ko: '한', hanja: '翰', g: 'm', hun: '편지', era: 'c', tone: 'h', flair: 'p' }, { ko: '정', hanja: '淨', g: 'm', hun: '깨끗할', era: 'c', tone: 's', flair: 'p' }, { ko: '탁', hanja: '琢', g: 'm', hun: '다듬을', era: 'c', tone: 'h', flair: 'p' },
    { ko: '우', hanja: '宇', g: 'm', hun: '집', era: 'm', tone: 's', flair: 'p' }, { ko: '목', hanja: '穆', g: 'm', hun: '화목할', era: 'c', tone: 's', flair: 'p' }, { ko: '언', hanja: '彦', g: 'm', hun: '선비', era: 'c', tone: 's', flair: 'p' },
    { ko: '징', hanja: '澄', g: 'm', hun: '맑을', era: 'm', tone: 's', flair: 'f' }, { ko: '현', hanja: '弦', g: 'm', hun: '시위', era: 'c', tone: 'h', flair: 'f' }, { ko: '혼', hanja: '渾', g: 'm', hun: '흐릴', era: 'c', tone: 'h', flair: 'p' },
    { ko: '양', hanja: '暘', g: 'm', hun: '해돋이', era: 'c', tone: 's', flair: 'p' }, { ko: '홍', hanja: '鴻', g: 'm', hun: '기러기', era: 'c', tone: 'h', flair: 'f' },
    // 공용
    { ko: '청', hanja: '淸', g: 'u', hun: '맑을', era: 'c', tone: 's', flair: 'f' }, { ko: '운', hanja: '雲', g: 'u', hun: '구름', era: 'c', tone: 's', flair: 'f' }, { ko: '한', hanja: '寒', g: 'u', hun: '찰', era: 'c', tone: 'h', flair: 'f' },
    { ko: '우', hanja: '羽', g: 'u', hun: '깃', era: 'm', tone: 's', flair: 'f' }, { ko: '림', hanja: '霖', g: 'u', initial: '임', hun: '장마', era: 'm', tone: 's', flair: 'f' }, { ko: '옥', hanja: '玉', g: 'u', hun: '구슬', era: 'c', tone: 's', flair: 'p' },
    { ko: '백', hanja: '白', g: 'u', hun: '흰', era: 'c', tone: 's', flair: 'f' }, { ko: '성', hanja: '星', g: 'u', hun: '별', era: 'm', tone: 's', flair: 'f' }, { ko: '람', hanja: '嵐', g: 'u', initial: '남', hun: '남기', era: 'c', tone: 'h', flair: 'f' },
    { ko: '선', hanja: '仙', g: 'u', hun: '신선', era: 'c', tone: 's', flair: 'f' }, { ko: '심', hanja: '心', g: 'u', hun: '마음', era: 'm', tone: 's', flair: 'p' }, { ko: '경', hanja: '鏡', g: 'u', hun: '거울', era: 'c', tone: 's', flair: 'p' },
    { ko: '진', hanja: '眞', g: 'u', hun: '참', era: 'm', tone: 's', flair: 'p' }, { ko: '현', hanja: '絃', g: 'u', hun: '줄', era: 'c', tone: 's', flair: 'p' }, { ko: '무', hanja: '無', g: 'u', hun: '없을', era: 'c', tone: 'h', flair: 'p' },
    { ko: '연', hanja: '煙', g: 'u', hun: '연기', era: 'c', tone: 's', flair: 'p' }, { ko: '상', hanja: '霜', g: 'u', hun: '서리', era: 'c', tone: 'h', flair: 'f' }, { ko: '설', hanja: '雪', g: 'u', hun: '눈', era: 'c', tone: 's', flair: 'f' },
    { ko: '유', hanja: '幽', g: 'u', hun: '그윽할', era: 'c', tone: 's', flair: 'f' }, { ko: '초', hanja: '初', g: 'u', hun: '처음', era: 'm', tone: 's', flair: 'p' }, { ko: '소', hanja: '疏', g: 'u', hun: '소통할', era: 'c', tone: 's', flair: 'p' },
    { ko: '령', hanja: '靈', g: 'u', initial: '영', hun: '신령', era: 'c', tone: 'h', flair: 'f' }, { ko: '명', hanja: '冥', g: 'u', hun: '어두울', era: 'c', tone: 'h', flair: 'f' }, { ko: '은', hanja: '隱', g: 'u', hun: '숨을', era: 'c', tone: 'h', flair: 'p' },
    // 여성적·몽환적
    { ko: '월', hanja: '月', g: 'f', hun: '달', era: 'c', tone: 's', flair: 'f' }, { ko: '요', hanja: '瑤', g: 'f', hun: '아름다운 옥', era: 'c', tone: 's', flair: 'f' }, { ko: '리', hanja: '璃', g: 'f', initial: '이', hun: '유리', era: 'm', tone: 's', flair: 'f' },
    { ko: '련', hanja: '蓮', g: 'f', initial: '연', hun: '연꽃', era: 'c', tone: 's', flair: 'f' }, { ko: '언', hanja: '嫣', g: 'f', hun: '아름다울', era: 'c', tone: 's', flair: 'f' }, { ko: '완', hanja: '婉', g: 'f', hun: '순할', era: 'c', tone: 's', flair: 'p' },
    { ko: '주', hanja: '姝', g: 'f', hun: '예쁠', era: 'c', tone: 's', flair: 'f' }, { ko: '석', hanja: '汐', g: 'f', hun: '조수', era: 'm', tone: 's', flair: 'f' }, { ko: '의', hanja: '漪', g: 'f', hun: '잔물결', era: 'c', tone: 's', flair: 'f' },
    { ko: '기', hanja: '綺', g: 'f', hun: '비단', era: 'c', tone: 's', flair: 'f' }, { ko: '항', hanja: '嫦', g: 'f', hun: '항아', era: 'c', tone: 's', flair: 'f' }, { ko: '아', hanja: '娥', g: 'f', hun: '예쁠', era: 'm', tone: 's', flair: 'p' },
    { ko: '예', hanja: '霓', g: 'f', hun: '무지개', era: 'c', tone: 's', flair: 'f' }, { ko: '연', hanja: '鳶', g: 'f', hun: '솔개', era: 'c', tone: 'h', flair: 'f' }, { ko: '란', hanja: '鸞', g: 'f', initial: '난', hun: '난새', era: 'c', tone: 'h', flair: 'f' },
    { ko: '황', hanja: '凰', g: 'f', hun: '봉황', era: 'c', tone: 'h', flair: 'f' }, { ko: '영', hanja: '瑩', g: 'f', hun: '밝을', era: 'm', tone: 's', flair: 'f' }, { ko: '유', hanja: '瑜', g: 'f', hun: '아름다운 옥', era: 'm', tone: 's', flair: 'p' },
    { ko: '락', hanja: '珞', g: 'f', initial: '낙', hun: '구슬', era: 'c', tone: 's', flair: 'f' }, { ko: '섬', hanja: '纖', g: 'f', hun: '가늘', era: 'c', tone: 's', flair: 'p' }, { ko: '소', hanja: '素', g: 'f', hun: '본디', era: 'm', tone: 's', flair: 'p' },
    { ko: '미', hanja: '薇', g: 'f', hun: '장미', era: 'm', tone: 's', flair: 'f' }, { ko: '단', hanja: '檀', g: 'f', hun: '박달나무', era: 'c', tone: 'h', flair: 'p' }, { ko: '앵', hanja: '櫻', g: 'f', hun: '앵두', era: 'm', tone: 's', flair: 'f' },
    { ko: '접', hanja: '蝶', g: 'f', hun: '나비', era: 'c', tone: 's', flair: 'f' }, { ko: '약', hanja: '若', g: 'f', hun: '같을', era: 'm', tone: 's', flair: 'p' }, { ko: '몽', hanja: '夢', g: 'f', hun: '꿈', era: 'm', tone: 's', flair: 'f' },
    { ko: '가', hanja: '歌', g: 'f', hun: '노래', era: 'm', tone: 's', flair: 'p' }, { ko: '대', hanja: '黛', g: 'f', hun: '눈썹먹', era: 'c', tone: 's', flair: 'f' },
    { ko: '하', hanja: '霞', g: 'f', hun: '노을', era: 'c', tone: 's', flair: 'f' }, { ko: '홍', hanja: '虹', g: 'f', hun: '무지개', era: 'm', tone: 's', flair: 'f' }, { ko: '자', hanja: '紫', g: 'f', hun: '자줏빛', era: 'c', tone: 'h', flair: 'f' },
    { ko: '취', hanja: '翠', g: 'f', hun: '푸를', era: 'c', tone: 's', flair: 'f' }, { ko: '벽', hanja: '碧', g: 'f', hun: '푸를', era: 'c', tone: 'h', flair: 'f' }, { ko: '령', hanja: '玲', g: 'f', initial: '영', hun: '옥소리', era: 'm', tone: 's', flair: 'f' },
    { ko: '경', hanja: '瓊', g: 'f', hun: '구슬', era: 'c', tone: 's', flair: 'f' }, { ko: '유', hanja: '柔', g: 'f', hun: '부드러울', era: 'm', tone: 's', flair: 'p' }, { ko: '상', hanja: '湘', g: 'f', hun: '강 이름', era: 'c', tone: 's', flair: 'p' },
    { ko: '심', hanja: '沁', g: 'f', hun: '스며들', era: 'c', tone: 's', flair: 'p' }, { ko: '천', hanja: '淺', g: 'f', hun: '얕을', era: 'c', tone: 's', flair: 'p' }, { ko: '만', hanja: '晩', g: 'f', hun: '늦을', era: 'c', tone: 's', flair: 'p' },
    { ko: '화', hanja: '華', g: 'f', hun: '빛날', era: 'c', tone: 's', flair: 'f' }, { ko: '희', hanja: '熙', g: 'f', hun: '빛날', era: 'm', tone: 's', flair: 'f' }, { ko: '운', hanja: '芸', g: 'f', hun: '향풀', era: 'm', tone: 's', flair: 'p' },
    { ko: '선', hanja: '嬋', g: 'f', hun: '고울', era: 'c', tone: 's', flair: 'f' }, { ko: '연', hanja: '姸', g: 'f', hun: '고울', era: 'm', tone: 's', flair: 'p' }, { ko: '혜', hanja: '蕙', g: 'f', hun: '혜초', era: 'c', tone: 's', flair: 'p' },
    { ko: '정', hanja: '婧', g: 'f', hun: '날씬할', era: 'm', tone: 'h', flair: 'p' }, { ko: '추', hanja: '秋', g: 'f', hun: '가을', era: 'm', tone: 's', flair: 'p' }, { ko: '향', hanja: '香', g: 'f', hun: '향기', era: 'c', tone: 's', flair: 'p' },
    { ko: '청', hanja: '晴', g: 'f', hun: '갤', era: 'm', tone: 's', flair: 'p' }, { ko: '은', hanja: '銀', g: 'f', hun: '은', era: 'm', tone: 's', flair: 'f' }, { ko: '진', hanja: '珍', g: 'f', hun: '보배', era: 'm', tone: 's', flair: 'p' },
  ],
};
