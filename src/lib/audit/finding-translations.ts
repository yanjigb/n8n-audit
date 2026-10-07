import type { AuditFinding, AuditResult, AuditCategory, CategoryScore } from "@/types/audit";

/**
 * Vietnamese translations for all static rule findings.
 * Templates use {0}, {1} etc. for affectedNodes[0], affectedNodes[1].
 */
interface FindingTranslation {
  title: string;
  description: string;
  recommendation: string;
}

const VI_TRANSLATIONS: Record<string, FindingTranslation> = {
  // ── Error Handling ──────────────────────────────────────────────
  "ERR-001": {
    title: "Thiếu Quy Trình Xử Lý Lỗi",
    description:
      "Không có quy trình xử lý lỗi nào được cấu hình trong cài đặt quy trình.",
    recommendation:
      "Vào Cài Đặt Quy Trình và thiết lập một quy trình xử lý lỗi để xử lý các thất bại.",
  },
  "ERR-002": {
    title: "Không Có Nút Error Trigger",
    description:
      "Không tìm thấy nút Error Trigger. Hãy cân nhắc thêm một nút để xử lý lỗi trong quy trình.",
    recommendation:
      "Thêm nút Error Trigger để bắt và xử lý lỗi trong quy trình.",
  },
  "ERR-003": {
    title: "Nút Không Có Đầu Ra Lỗi",
    description:
      '"{0}" thực hiện gọi bên ngoài nhưng không có đầu ra lỗi được kết nối.',
    recommendation:
      "Thiết lập 'On Error' thành 'Continue Error Output' cho \"{0}\" và kết nối đầu ra lỗi.",
  },
  "ERR-004": {
    title: "Thiếu Chiến Lược Continue-on-Fail",
    description:
      '"{0}" không có cấu hình continueOnFail hoặc onError. Lỗi sẽ dừng toàn bộ quy trình.',
    recommendation:
      'Cân nhắc thiết lập continueOnFail hoặc onError cho "{0}".',
  },
  "ERR-005": {
    title: "Không Có Đường Dẫn Thông Báo Lỗi",
    description:
      "Không có kênh thông báo nào được thiết lập cho các tình huống lỗi. Các thất bại sẽ không được phát hiện.",
    recommendation:
      "Thêm nút Error Trigger kết nối với kênh thông báo (Slack, Email, v.v.).",
  },
  "ERR-006": {
    title: "Thiếu Cấu Hình Retry",
    description:
      '"{0}" không có cấu hình retry. Lỗi tạm thời sẽ không được thử lại.',
    recommendation:
      'Bật retryOnFail cho "{0}" để xử lý lỗi API tạm thời.',
  },
  "ERR-007": {
    title: "Đường Dẫn Lỗi Bế Tắc",
    description:
      'Đầu ra lỗi từ "{0}" đi đến "{1}" nhưng không có hành động tiếp theo. Lỗi bị nuốt.',
    recommendation:
      'Thêm bước thông báo hoặc ghi log sau "{1}" để xử lý lỗi từ "{0}" đúng cách.',
  },
  "ERR-008": {
    title: "Không Có Timeout Cho Gọi Bên Ngoài",
    description:
      '"{0}" không có timeout rõ ràng. Có thể treo vô thời hạn nếu dịch vụ bên ngoài không phản hồi.',
    recommendation:
      'Thiết lập timeout (ví dụ: 30000ms) cho "{0}" để tránh chờ vô thời hạn.',
  },

  // ── Security ────────────────────────────────────────────────────
  "SEC-001": {
    title: "Thông Tin Đăng Nhập Cứng",
    description:
      '"{0}" có giá trị nhạy cảm được mã hóa cứng trong tham số. Nên sử dụng n8n Credentials.',
    recommendation:
      'Di chuyển giá trị nhạy cảm trong "{0}" sang n8n Credential.',
  },
  "SEC-002": {
    title: "Gọi HTTP Không An Toàn",
    description:
      '"{0}" sử dụng HTTP không an toàn thay vì HTTPS. Dữ liệu được gửi không mã hóa.',
    recommendation: 'Đổi URL trong "{0}" từ http:// sang https://.',
  },
  "SEC-003": {
    title: "Khóa API Bị Lộ Trong Biểu Thức",
    description:
      '"{0}" chứa mẫu giống khóa API trong tham số. Khóa có thể bị lộ.',
    recommendation:
      'Xóa khóa API khỏi tham số "{0}" và sử dụng n8n Credentials.',
  },
  "SEC-004": {
    title: "Thiếu Tham Chiếu Credentials",
    description:
      '"{0}" gọi endpoint API nhưng không có credentials được cấu hình.',
    recommendation: 'Thêm credentials xác thực phù hợp cho "{0}".',
  },
  "SEC-005": {
    title: "Webhook Không Có Xác Thực",
    description:
      '"{0}" webhook không có xác thực. Bất kỳ ai có URL đều có thể kích hoạt.',
    recommendation:
      'Thêm xác thực Header Auth, Basic Auth hoặc JWT cho "{0}".',
  },
  "SEC-006": {
    title: "Nút Execute Command Hiện Diện",
    description:
      '"{0}" có thể thực thi lệnh shell trên server. Rủi ro bảo mật nghiêm trọng.',
    recommendation:
      'Xóa "{0}" hoặc thay thế bằng nút Code. Nếu cần thiết, thêm xác thực đầu vào nghiêm ngặt.',
  },
  "SEC-007": {
    title: "Nút Code Có Mẫu Nguy Hiểm",
    description:
      '"{0}" chứa mẫu code nguy hiểm (eval, Function constructor, hoặc child_process). Rủi ro code injection.',
    recommendation:
      'Xóa các mẫu eval/Function/exec khỏi "{0}". Sử dụng phương pháp phân tích an toàn thay thế.',
  },
  "SEC-008": {
    title: "Webhook Chấp Nhận Tất Cả Phương Thức HTTP",
    description:
      '"{0}" chấp nhận tất cả phương thức HTTP. Các phương thức không cần thiết tăng bề mặt tấn công.',
    recommendation:
      'Giới hạn "{0}" chỉ chấp nhận phương thức HTTP cần thiết (thường là POST).',
  },
  "SEC-009": {
    title: "Xác Minh SSL Bị Tắt",
    description:
      '"{0}" đã tắt xác minh chứng chỉ SSL. Dễ bị tấn công man-in-the-middle.',
    recommendation:
      'Bật xác minh SSL trên "{0}". Sử dụng chứng chỉ hợp lệ thay vì tắt xác minh.',
  },
  "SEC-010": {
    title: "URL Mạng Nội Bộ Bị Lộ",
    description:
      '"{0}" tham chiếu địa chỉ mạng nội bộ. Có thể lộ dịch vụ nội bộ nếu quy trình được chia sẻ.',
    recommendation:
      'Sử dụng biến môi trường hoặc n8n credentials cho URL nội bộ trong "{0}".',
  },
  "SEC-011": {
    title: "Thiếu Xác Thực Đầu Vào Trên Webhook",
    description:
      '"{0}" nhận đầu vào bên ngoài mà không có bước xác thực. Dữ liệu độc hại có thể lan truyền.',
    recommendation:
      'Thêm nút xác thực (IF, Switch, hoặc Code) sau "{0}" để kiểm tra schema đầu vào.',
  },

  // ── Performance ─────────────────────────────────────────────────
  "PERF-001": {
    title: "Vòng Lặp Với HTTP Requests",
    description:
      '"{0}" đưa dữ liệu vào HTTP Request "{1}". Mỗi phần tử batch tạo một gọi HTTP riêng.',
    recommendation:
      'Sử dụng endpoint API hàng loạt hoặc tăng kích thước batch cho "{0}".',
  },
  "PERF-002": {
    title: "Thiếu Xử Lý Batch",
    description:
      'Webhook trigger "{0}" đưa dữ liệu trực tiếp vào "{1}" mà không có xử lý batch.',
    recommendation:
      'Thêm nút SplitInBatches giữa "{0}" và "{1}" cho payload lớn.',
  },
  "PERF-003": {
    title: "Nút Tuần Tự Có Thể Song Song Hóa",
    description:
      '"{0}" và "{1}" chạy tuần tự nhưng có vẻ độc lập. Có thể chạy song song.',
    recommendation:
      'Kết nối cả "{0}" và "{1}" vào cùng một nút cha để thực thi song song.',
  },
  "PERF-004": {
    title: "Nút Trùng Lặp",
    description: '"{0}" có cùng loại và tham số với "{1}".',
    recommendation:
      'Cân nhắc gộp "{0}" và "{1}" thành một nút duy nhất.',
  },
  "PERF-005": {
    title: "Số Lượng Nút Quá Nhiều",
    description:
      "Quy trình có quá nhiều nút hoạt động. Cân nhắc chia nhỏ thành các quy trình con.",
    recommendation:
      "Chia thành các quy trình con sử dụng nút Execute Workflow để dễ bảo trì hơn.",
  },
  "PERF-006": {
    title: "Dữ Liệu Lớn Không Có Giới Hạn",
    description:
      '"{0}" không có LIMIT hoặc phân trang được cấu hình.',
    recommendation:
      'Thêm mệnh đề LIMIT hoặc phân trang cho "{0}" để tránh truy xuất dữ liệu quá mức.',
  },
  "PERF-007": {
    title: "Nút Code/Function Không Sử Dụng",
    description:
      'Đầu ra của "{0}" không được kết nối với nút nào. Tính toán bị lãng phí.',
    recommendation:
      'Kết nối đầu ra "{0}" hoặc xóa nếu không cần thiết.',
  },

  // ── Best Practices ──────────────────────────────────────────────
  "BP-001": {
    title: "Tên Nút Mặc Định",
    description:
      '"{0}" vẫn dùng tên mặc định. Quy trình khó hiểu hơn.',
    recommendation:
      'Đổi tên "{0}" để mô tả mục đích (ví dụ: "Lấy Dữ Liệu Người Dùng" thay vì "HTTP Request").',
  },
  "BP-002": {
    title: "Thiếu Ghi Chú Nút",
    description:
      '"{0}" không có ghi chú. Logic phức tạp nên được ghi chép lại.',
    recommendation:
      'Thêm ghi chú cho "{0}" giải thích nó làm gì và tại sao.',
  },
  "BP-003": {
    title: "Độ Phức Tạp Quy Trình Cao",
    description:
      "Độ phức tạp cyclomatic của quy trình vượt ngưỡng. Quy trình này khó bảo trì.",
    recommendation:
      "Chia thành các quy trình con nhỏ hơn sử dụng nút Execute Workflow.",
  },
  "BP-004": {
    title: "Quy Trình Lồng Sâu",
    description:
      "Chuỗi nút quá sâu vượt ngưỡng. Chuỗi sâu khó debug.",
    recommendation:
      "Cân nhắc chia chuỗi sâu thành quy trình con để rõ ràng hơn.",
  },
  "BP-005": {
    title: "Tên Quy Trình Chung Chung",
    description:
      "Tên quy trình chung chung và không mô tả mục đích của quy trình.",
    recommendation:
      "Đổi tên quy trình để mô tả chức năng (ví dụ: 'Đồng Bộ Đơn Hàng Shopify Sang Airtable').",
  },
  "BP-006": {
    title: "Nút Bị Vô Hiệu Hóa Còn Trong Quy Trình",
    description:
      "Có nút bị vô hiệu hóa trong quy trình. Gây rối canvas và có thể gây nhầm lẫn.",
    recommendation:
      "Xóa nút bị vô hiệu hóa hoặc thêm ghi chú giải thích tại sao chúng bị tắt.",
  },
  "BP-007": {
    title: "Thiếu Metadata Kiểm Soát Phiên Bản",
    description:
      "Quy trình không có versionId hoặc trường meta. Không thể theo dõi thay đổi.",
    recommendation:
      "Bật tính năng phiên bản quy trình trong cài đặt n8n.",
  },
  "BP-008": {
    title: "Thiếu Tags Quy Trình",
    description:
      "Quy trình không có tags. Tags giúp tổ chức và quản lý quy trình giữa các nhóm.",
    recommendation:
      "Thêm tags như tên khách hàng, môi trường (prod/dev), và danh mục quy trình.",
  },
  "BP-009": {
    title: "Phát Hiện Nút Mồ Côi",
    description:
      "Có nút mồ côi không được kết nối với bất kỳ đường dẫn quy trình nào.",
    recommendation:
      "Kết nối các nút này vào quy trình hoặc xóa nếu không sử dụng.",
  },
  "BP-010": {
    title: "Credential Phân Tán",
    description:
      "Quy trình sử dụng nhiều loại credential khác nhau. Quản lý credential phức tạp.",
    recommendation:
      "Ghi chép tất cả credentials. Đảm bảo mỗi credential có người sở hữu, lịch xoay vòng và phạm vi truy cập phù hợp.",
  },

  // ── AI Security ─────────────────────────────────────────────────
  "AI-001": {
    title: "Rủi Ro Prompt Injection",
    description:
      '"{0}" nhận đầu vào động trực tiếp trong prompt mà không có bước sanitization. Dễ bị prompt injection.',
    recommendation:
      'Thêm nút Code hoặc Function trước "{0}" để sanitize và xác thực đầu vào trước khi đưa vào AI prompt.',
  },
  "AI-002": {
    title: "Đầu Ra AI Không Được Xác Thực",
    description:
      'Đầu ra "{0}" đi trực tiếp đến "{1}" mà không có xác thực. Nội dung AI có thể gây hành động ngoài ý muốn.',
    recommendation:
      'Thêm nút xác thực/lọc giữa "{0}" và "{1}" để kiểm tra đầu ra AI trước khi thực thi.',
  },
  "AI-003": {
    title: "Dữ Liệu Nhạy Cảm Gửi Đến AI API",
    description:
      'Dữ liệu từ "{0}" đưa vào nút AI "{1}". Dữ liệu database/CRM có thể chứa PII.',
    recommendation:
      'Thêm bước ẩn dữ liệu trước "{1}" để che giấu PII trước khi gửi đến AI API.',
  },
  "AI-004": {
    title: "Không Có Giới Hạn Tốc Độ Cho AI API",
    description:
      '"{0}" được kích hoạt bởi webhook mà không có giới hạn tốc độ. Yêu cầu quá mức có thể gây chi phí API cao.',
    recommendation:
      'Thêm nút Wait, SplitInBatches, hoặc giới hạn tốc độ trước "{0}" để kiểm soát sử dụng API.',
  },
  "AI-005": {
    title: "Không Có Phê Duyệt Con Người Cho Quyết Định AI",
    description:
      'Nút AI "{0}" điều khiển hành động trên hệ thống bên ngoài mà không có bước phê duyệt con người.',
    recommendation:
      'Thêm nút Wait for Webhook hoặc phê duyệt thủ công giữa "{0}" và các nút hành động quan trọng.',
  },
  "AI-006": {
    title: "Cấu Hình Model AI Chưa Được Chỉ Định",
    description:
      '"{0}" thiếu cấu hình rõ ràng cho một số tham số AI.',
    recommendation:
      'Thiết lập model, temperature, max_tokens trên "{0}" cho hành vi dự đoán được và kiểm soát chi phí.',
  },

  // ── Data Privacy ────────────────────────────────────────────────
  "PRIV-001": {
    title: "Trường PII Trong Tham Số Quy Trình",
    description:
      '"{0}" tham chiếu các trường liên quan đến PII. Đảm bảo xử lý đúng theo quy định bảo mật.',
    recommendation:
      'Xem xét xử lý PII trong "{0}". Cân nhắc ẩn dữ liệu, mã hóa, hoặc chỉ sử dụng các trường cần thiết.',
  },
  "PRIV-002": {
    title: "Dữ Liệu Gửi Đến Nhiều Dịch Vụ Bên Ngoài",
    description:
      "Quy trình kết nối với nhiều loại dịch vụ bên ngoài khác nhau. Bề mặt phơi nhiễm dữ liệu lớn.",
    recommendation:
      "Ghi chép tất cả luồng dữ liệu. Đảm bảo mỗi dịch vụ chỉ nhận dữ liệu tối thiểu cần thiết.",
  },
  "PRIV-003": {
    title: "Không Có Logic Dọn Dẹp Hoặc Lưu Trữ Dữ Liệu",
    description:
      "Quy trình đọc/ghi dữ liệu nhưng không có cơ chế dọn dẹp hoặc quản lý lưu trữ. Dữ liệu có thể tích lũy không giới hạn.",
    recommendation:
      "Thêm chính sách lưu trữ dữ liệu hoặc bước dọn dẹp. Cân nhắc lên lịch quy trình xóa dữ liệu định kỳ.",
  },
  "PRIV-004": {
    title: "Truy Xuất Dữ Liệu Hàng Loạt Không Có Lọc",
    description:
      '"{0}" truy xuất tất cả trường/bản ghi mà không có lọc cột. Có thể phơi nhiễm dữ liệu nhạy cảm không cần thiết.',
    recommendation:
      'Chỉ định các trường cần thiết trong "{0}" thay vì truy xuất tất cả cột.',
  },
  "PRIV-005": {
    title: "Ghi Log Dữ Liệu Không Có Kiểm Soát Quyền Riêng Tư",
    description:
      "Cài đặt lưu dữ liệu thực thi chưa được cấu hình rõ ràng. Dữ liệu nhạy cảm có thể được lưu trong lịch sử thực thi.",
    recommendation:
      "Cấu hình saveDataSuccessExecution và saveDataErrorExecution trong cài đặt quy trình để kiểm soát lưu trữ dữ liệu.",
  },

  // ── Compliance ──────────────────────────────────────────────────
  "COMP-001": {
    title: "Thiếu Nhật Ký Kiểm Tra / Logging",
    description:
      "Quy trình thực hiện hành động bên ngoài nhưng không có ghi log kiểm tra. Hành động không thể truy vết hoặc kiểm toán.",
    recommendation:
      "Thêm cơ chế ghi log (ghi database, bảng tính, hoặc dịch vụ audit log) để ghi lại hành động quy trình cho mục đích tuân thủ.",
  },
  "COMP-002": {
    title: "Không Có Phê Duyệt Con Người Cho Thao Tác Quan Trọng",
    description:
      "Quy trình có thao tác quan trọng mà không có bước phê duyệt con người.",
    recommendation:
      "Thêm nút Wait for Webhook, Form Trigger, hoặc phê duyệt Slack trước các thao tác quan trọng.",
  },
  "COMP-003": {
    title: "Quy Trình Không Có Tags",
    description:
      "Quy trình không có tags. Tags cần thiết cho quản trị, theo dõi khách hàng và phân loại tuân thủ.",
    recommendation:
      "Thêm tags như tên khách hàng, môi trường (prod/staging), mức phân loại dữ liệu và bộ phận.",
  },
  "COMP-004": {
    title: "Thiếu Timeout Thực Thi",
    description:
      "Không có executionTimeout được thiết lập. Quy trình có thể chạy vô thời hạn, tiêu tốn tài nguyên.",
    recommendation:
      "Thiết lập executionTimeout trong cài đặt quy trình (ví dụ: 300 giây) để ngăn thực thi chạy tự do.",
  },
  "COMP-005": {
    title: "Chưa Cấu Hình Lưu Dữ Liệu Thực Thi",
    description:
      "Cài đặt lưu dữ liệu thực thi chưa được cấu hình. Dựa vào mặc định instance có thể không đáp ứng yêu cầu tuân thủ.",
    recommendation:
      "Thiết lập saveDataErrorExecution thành 'all' và cấu hình saveDataSuccessExecution theo chính sách lưu trữ dữ liệu.",
  },
  "COMP-006": {
    title: "Thiếu Tài Liệu Quy Trình",
    description:
      "Quy trình không có tài liệu (không meta, không sticky notes, không ghi chú nút). Mục đích và xử lý dữ liệu chưa được ghi chép.",
    recommendation:
      "Thêm Sticky Note mô tả: mục đích quy trình, chủ sở hữu dữ liệu, phân loại dữ liệu, ngày xem xét cuối, và nhóm phụ trách.",
  },

  // ── Vendor Risk ─────────────────────────────────────────────────
  "VENDOR-001": {
    title: "Phụ Thuộc Dịch Vụ Bên Thứ Ba Cao",
    description:
      "Quy trình phụ thuộc vào nhiều loại dịch vụ bên ngoài khác nhau.",
    recommendation:
      "Thực hiện đánh giá rủi ro nhà cung cấp cho mỗi dịch vụ. Đảm bảo SLA, chứng nhận bảo mật (SOC 2), và kế hoạch phản hồi sự cố.",
  },
  "VENDOR-002": {
    title: "Endpoint Bên Ngoài Chưa Được Xác Minh",
    description:
      '"{0}" gọi endpoint không phải endpoint API thường được nhận diện.',
    recommendation:
      "Xác minh endpoint là đáng tin cậy. Thêm vào danh sách domain được phép của tổ chức.",
  },
  "VENDOR-003": {
    title: "Điểm Thất Bại Duy Nhất - Dịch Vụ Bên Ngoài",
    description:
      '"{0}" là điểm thất bại duy nhất. Nếu dịch vụ bên ngoài này ngừng hoạt động, quy trình dừng lại.',
    recommendation:
      'Thêm cấu hình retry, xử lý lỗi, hoặc đường dẫn dự phòng cho "{0}".',
  },
  "VENDOR-004": {
    title: "Không Có Giám Sát Sức Khỏe Nhà Cung Cấp",
    description:
      "Quy trình sử dụng nhiều dịch vụ bên ngoài nhưng không có giám sát sức khỏe. Sự cố dịch vụ có thể không được phát hiện.",
    recommendation:
      "Tạo quy trình kiểm tra sức khỏe định kỳ ping các dịch vụ bên ngoài quan trọng và cảnh báo khi có sự cố.",
  },
  "VENDOR-005": {
    title: "Chia Sẻ Credentials Giữa Các Nút",
    description:
      "Credential được sử dụng bởi nhiều nút. Phạm vi ảnh hưởng lớn nếu bị xâm phạm.",
    recommendation:
      "Xem xét liệu tất cả các nút có cần cùng credential không. Cân nhắc credentials riêng với quyền hạn tối thiểu.",
  },
};

/**
 * Replace {0}, {1}, etc. in template with affectedNodes values.
 */
function formatTemplate(template: string, finding: AuditFinding): string {
  let result = template;
  if (finding.affectedNodes) {
    finding.affectedNodes.forEach((name, i) => {
      result = result.replaceAll(`{${i}}`, name);
    });
  }
  return result;
}

/**
 * Translate a single finding's title, description, and recommendation.
 */
function translateFinding(
  finding: AuditFinding,
  locale: string
): AuditFinding {
  if (locale !== "vi") return finding;

  const translation = VI_TRANSLATIONS[finding.ruleId];
  if (!translation) return finding;

  return {
    ...finding,
    title: formatTemplate(translation.title, finding),
    description: formatTemplate(translation.description, finding),
    recommendation: formatTemplate(translation.recommendation, finding),
  };
}

/**
 * Translate all findings in an AuditResult (used for static engine results).
 */
export function translateAuditResult(
  result: AuditResult,
  locale: string
): AuditResult {
  if (locale !== "vi") return result;

  const categories = {} as Record<AuditCategory, CategoryScore>;
  for (const [key, catScore] of Object.entries(result.categories)) {
    categories[key as AuditCategory] = {
      ...catScore,
      findings: catScore.findings.map((f) => translateFinding(f, locale)),
    };
  }

  return { ...result, categories };
}
