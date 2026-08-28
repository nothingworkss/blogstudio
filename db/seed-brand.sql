insert into brands (id, name, domain, tone, default_cta, forbidden_words)
values (
  '00000000-0000-4000-8000-000000000001',
  'nothingmatters',
  'https://nothingmatters.kr',
  '직접 만드는 사람이 옆에서 조용히 골라주는 듯한 말투. 상담원처럼 딱딱하게 안내하지 않고, 제품 자랑보다 고르는 기준을 먼저 말한다.',
  '필요한 날짜와 수량만 먼저 알려주셔도 괜찮아요. 어떤 구성이 편할지 같이 정리해볼게요.',
  array['무조건', '완벽한', '전국 택배 가능', '1위', '최고', '대박', '역대급', '100% 만족']
)
on conflict (id) do update set
  name = excluded.name,
  domain = excluded.domain,
  tone = excluded.tone,
  default_cta = excluded.default_cta,
  forbidden_words = excluded.forbidden_words;
