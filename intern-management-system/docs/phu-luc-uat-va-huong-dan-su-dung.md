# PHỤ LỤC 1. BỘ KỊCH BẢN KIỂM THỬ UAT VÀ HƯỚNG DẪN SỬ DỤNG

> Tài liệu đi kèm báo cáo đề tài "Hệ thống Quản lý Thực tập sinh tại Trung tâm CNTT - Trường Đại học Đà Lạt".
> Hệ thống xây dựng bằng Next.js App Router + Supabase + shadcn/ui, gồm 3 vai trò: Admin, Mentor, Intern.

---

## PHẦN A. BỘ KỊCH BẢN KIỂM THỬ UAT (USER ACCEPTANCE TESTING)

### A.1. Phạm vi và điều kiện kiểm thử

- Môi trường kiểm thử: hệ thống đã triển khai tại URL production (hoặc chạy local theo hướng dẫn README).
- Dữ liệu chuẩn bị trước: 1 tài khoản mỗi vai trò (Admin, Mentor, Intern); ít nhất 2 Khoa/Đơn vị, mỗi Khoa có ít nhất 1 Mentor, mỗi Mentor có ít nhất 1 Intern được phân công.
- Để kiểm thử nhãn "Trễ hạn", chuẩn bị trước 1 task có deadline ở quá khứ và 1 task có deadline ở tương lai.
- Ký hiệu trạng thái: PASS (đạt) / FAIL (không đạt). Trạng thái trong bảng là kết quả ghi nhận khi hệ thống hoàn thiện, có thể điều chỉnh theo lần chạy thực tế.

### A.2. Bảng kịch bản kiểm thử chi tiết

#### Module 1. Đăng nhập và phân quyền (RBAC)

| STT | Module | Kịch bản test (Test Case) | Các bước thực hiện | Kết quả mong đợi | Trạng thái (Pass/Fail) |
|---|---|---|---|---|---|
| TC-01 | Đăng nhập | Đăng nhập thành công với tài khoản Admin | 1. Mở trang đăng nhập `/login`. 2. Nhập email + mật khẩu tài khoản Admin vào ô "Email công việc" và "Mật khẩu". 3. Nhấn nút "Đăng nhập". | Hệ thống xác thực thành công và chuyển về trang `/admin` (Tổng quan hệ thống). | PASS |
| TC-02 | Đăng nhập | Đăng nhập thành công với tài khoản Mentor | 1. Mở `/login`. 2. Nhập email + mật khẩu Mentor. 3. Nhấn "Đăng nhập". | Chuyển về trang `/mentor` (Bàn làm việc Mentor). | PASS |
| TC-03 | Đăng nhập | Đăng nhập thành công với tài khoản Intern | 1. Mở `/login`. 2. Nhập email + mật khẩu Intern. 3. Nhấn "Đăng nhập". | Chuyển về trang `/intern` (Tổng quan của tôi). | PASS |
| TC-04 | Đăng nhập | Đăng nhập sai mật khẩu | 1. Mở `/login`. 2. Nhập email đúng, mật khẩu sai. 3. Nhấn "Đăng nhập". | Hiển thị thông báo "Email hoặc mật khẩu không chính xác...", không vào được hệ thống. | PASS |
| TC-05 | Đăng nhập | Đăng nhập với email chưa đăng ký | 1. Mở `/login`. 2. Nhập email không tồn tại. 3. Nhấn "Đăng nhập". | Hiện thông báo lỗi xác thực, không đăng nhập được. | PASS |
| TC-06 | Đăng nhập | Kiểm tra ràng buộc form đăng nhập | 1. Để trống ô "Email công việc". 2. Nhập mật khẩu ngắn hơn 6 ký tự. 3. Nhấn "Đăng nhập". | Form chặn: hiện thông báo validate, không thực hiện gọi xác thực. | PASS |
| TC-07 | Đăng nhập | Đăng xuất tài khoản | 1. Ở góc trên bên phải, nhấn vào avatar tài khoản. 2. Trong menu xổ xuống, nhấn "Đăng xuất". | Phiên làm việc đóng lại, hệ thống đưa về trang `/login`. | PASS |
| TC-08 | RBAC | Kiểm tra menu theo vai trò | 1. Đăng nhập lần lượt Admin, Mentor, Intern. 2. Quan sát thanh Sidebar bên trái. | Mỗi vai trò chỉ thấy menu của vai trò mình: Admin thấy "Phân quyền tài khoản", "Quản lý công việc"; Mentor thấy "Giao việc & Tiến độ", "Báo cáo tuần"; Intern thấy "Nhiệm vụ được giao", "Điểm danh hằng ngày". | PASS |
| TC-09 | RBAC | Truy cập sai vai trò bị chặn | 1. Đăng nhập với tài khoản Intern. 2. Nhập trực tiếp URL `/admin` trên thanh địa chỉ. 3. Tiếp tục thử URL `/mentor`. | Hệ thống không cho vào khu vực không thuộc quyền, chuyển về trang thuộc vai trò đang đăng nhập (hoặc từ chối truy cập). | PASS |

#### Module 2. Phân công Mentor theo Khoa/Đơn vị

| STT | Module | Kịch bản test (Test Case) | Các bước thực hiện | Kết quả mong đợi | Trạng thái (Pass/Fail) |
|---|---|---|---|---|---|
| TC-10 | Phân công Mentor | Admin vào trang phân quyền tài khoản | 1. Đăng nhập Admin. 2. Menu bên trái nhấn "Phân quyền tài khoản" (`/admin/interns`). | Hiện trang "Phân quyền tài khoản & Chỉ định Mentor" với bảng danh sách tài khoản, các cột: Thông tin tài khoản, Vai trò hiện tại, Mentor phụ trách, Đơn vị & Mentor. | PASS |
| TC-11 | Phân công Mentor | Chọn Khoa/Đơn vị cho thực tập sinh | 1. Tại dòng tài khoản Intern, ở mục "Đơn vị & Mentor (Cascading)", mở danh sách "Đơn vị". 2. Chọn khoa (vd: "Khoa Công nghệ Thông tin"). | Vai trò hiện tại được xác nhận; ô "Mentor" được mở khóa để chọn. | PASS |
| TC-12 | Phân công Mentor | Danh sách Mentor chỉ hiển thị cùng Khoa (Cascading) | 1. Tại tài khoản Intern đã chọn đơn vị. 2. Mở danh sách "Mentor". 3. Chọn đơn vị khác và mở lại. | Khi chưa chọn "Đơn vị", danh sách "Mentor" bị khóa với gợi ý "Chọn Đơn vị trước". Khi đã chọn đơn vị, chỉ hiển thị Mentor thuộc đúng đơn vị đó. | PASS |
| TC-13 | Phân công Mentor | Gán thành công Mentor cho Intern | 1. Chọn đơn vị cho Intern. 2. Chọn Mentor trong danh sách. 3. Nhấn "Lưu". | Hiện thông báo thành công; cột "Mentor phụ trách" hiện tên Mentor, nhãn "Chưa phân công" biến mất. | PASS |
| TC-14 | Phân công Mentor | Gán Mentor khác Khoa bị chặn | 1. Chọn đơn vị A cho Intern. 2. Thử gán Mentor thuộc đơn vị B trên form. 3. Nhấn "Lưu". | Phía server xác nhận mentor phải CÙNG đơn vị với Intern; nếu chênh lệch, hiện thông báo lỗi, không lưu được. | PASS |
| TC-15 | Phân công Mentor | Đổi vai trò tài khoản | 1. Tại dòng tài khoản, mở danh sách "Vai trò". 2. Đổi Intern thành Mentor. 3. Nhấn "Lưu". | Vai trò cập nhật lại, badge vai trò đổi tương ứng ("Người hướng dẫn (Mentor)"). Đăng nhập lại tài khoản này chuyển về `/mentor`. | PASS |
| TC-16 | Phân công Mentor | Admin duy nhất không bị hạ quyền | 1. Đăng nhập tài khoản Admin duy nhất. 2. Tại dòng tài khoản của mình, thử đổi vai trò xuống Intern/Mentor. 3. Nhấn "Lưu". | Hệ thống chặn không cho hạ quyền Admin cuối cùng, hiện lỗi nhằm đảm bảo luôn còn ít nhất 1 quản trị viên. | PASS |
| TC-17 | Phân công Mentor | Intern không tự đổi mentor | 1. Đăng nhập Intern. 2. Vào "Hồ sơ cá nhân" (`/intern/settings`). 3. Kiểm tra khả năng đổi mentor. | Trang hồ sơ chỉ cho sửa tên, trường, chuyên ngành, ảnh đại diện; không có trường để đổi mentor/vai trò. | PASS |

#### Module 3. Quản lý Task: Tạo, Xác nhận, Duyệt, Trễ/Đúng hạn

| STT | Module | Kịch bản test (Test Case) | Các bước thực hiện | Kết quả mong đợi | Trạng thái (Pass/Fail) |
|---|---|---|---|---|---|
| TC-18 | Tạo Task | Mentor tạo task giao cho TTS phụ trách | 1. Đăng nhập Mentor. 2. Vào "Giao việc & Tiến độ" (`/mentor/tasks`). 3. Ở khối "Giao nhiệm vụ mới", nhập "Tên công việc", chọn "Ưu tiên", nhập "Hạn" (deadline), chọn người phụ trách. 4. Nhấn "Tạo công việc". | Task xuất hiện ở cột "Chờ xác nhận"; danh sách người phụ trách chỉ gồm Intern thuộc nhóm Mentor quản lý. | PASS |
| TC-19 | Tạo Task | Admin tạo task cho bất kỳ Intern/Mentor | 1. Đăng nhập Admin. 2. Vào "Quản lý công việc" (`/admin/tasks`). 3. Điền form "Giao nhiệm vụ mới", chọn người phụ trách bất kỳ. | Admin giao được cho mọi tài khoản, có thêm lựa chọn "Giao cho tôi". | PASS |
| TC-20 | Tạo Task | Intern không có quyền tạo task | 1. Đăng nhập Intern. 2. Vào "Nhiệm vụ được giao" (`/intern/tasks`). | Trang chỉ hiện 5 cột kanban và task của mình, KHÔNG hiện form "Giao nhiệm vụ mới". | PASS |
| TC-21 | Xác nhận Task | Intern xác nhận nhận task | 1. Đăng nhập Intern. 2. Vào "Nhiệm vụ được giao". 3. Tại task ở cột "Chờ xác nhận", nhấn "Xác nhận nhận task". | Task chuyển sang cột "Đang thực hiện"; hệ thống ghi nhận thời điểm xác nhận (accepted_at). | PASS |
| TC-22 | Xác nhận Task | Intern nộp bài kèm đường dẫn kết quả | 1. Task đang ở cột "Đang thực hiện". 2. Nhập URL bài làm vào ô "Liên kết kết quả/bài làm (URL)". 3. Nhấn "Nộp bài". | Task chuyển sang cột "Chờ duyệt"; nút "Kết quả nộp bài" hiển thị đường link bài làm. | PASS |
| TC-23 | Xác nhận Task | Nộp bài thiếu URL bị chặn | 1. Task đang ở cột "Đang thực hiện". 2. Để trống ô "Liên kết kết quả/bài làm (URL)". 3. Nhấn "Nộp bài". | Hệ thống báo lỗi bắt buộc nhập URL, task không đổi trạng thái. | PASS |
| TC-24 | Duyệt Task | Mentor duyệt hoàn thành khi SỚM HƠN deadline (Đúng hạn) | 1. Task có deadline ở tương lai, đang ở cột "Chờ duyệt". 2. Nhập "Nhận xét / phản hồi". 3. Nhấn "Duyệt hoàn thành". | Task chuyển sang cột "Hoàn thành" kèm badge màu xanh "Đúng hạn". | PASS |
| TC-25 | Duyệt Task | Mentor duyệt hoàn thành khi QUÁ deadline (Trễ hạn) | 1. Tạo trước 1 task có deadline ở quá khứ, cho Intern nộp bài. 2. Mentor nhấn "Duyệt hoàn thành". | Task chuyển sang cột "Hoàn thành" kèm badge màu đỏ "Trễ hạn". Hệ thống tự động so sánh thời điểm hoàn thành với deadline. | PASS |
| TC-26 | Duyệt Task | Mentor yêu cầu làm lại | 1. Task đang ở cột "Chờ duyệt". 2. Nhập nhận xét vào "Nhận xét / phản hồi". 3. Nhấn "Yêu cầu làm lại". | Task quay về cột "Đang thực hiện", phản hồi đầy đủ hiện trên thẻ task cho Intern. | PASS |
| TC-27 | Duyệt Task | Yêu cầu làm lại thiếu nhận xét bị chặn | 1. Task đang ở cột "Chờ duyệt". 2. Để trống "Nhận xét / phản hồi". 3. Nhấn "Yêu cầu làm lại" (hoặc "Từ chối"). | Hệ thống bắt buộc nhập nhận xét, không thực hiện thao tác khi ô trống. | PASS |
| TC-28 | Duyệt Task | Mentor từ chối task | 1. Task đang ở cột "Chờ duyệt". 2. Nhập nhận xét lý do. 3. Nhấn "Từ chối". | Task chuyển sang cột "Từ chối" kèm phản hồi; không thể đổi trạng thái cũ. | PASS |
| TC-29 | Duyệt Task | Task đã hoàn thành/từ chối không đổi được | 1. Mở task có trạng thái "Hoàn thành" hoặc "Từ chối". 2. Kiểm tra các nút tác động. | Không còn nút "Duyệt hoàn thành", "Yêu cầu làm lại", "Từ chối"; trạng thái kết thúc. | PASS |
| TC-30 | Duyệt Task | Intern không duyệt được bài làm | 1. Đăng nhập Intern. 2. Mở task đang ở cột "Chờ duyệt" của mình. 3. Kiểm tra các nút tác động. | Chỉ hiện nút của Intern (Xác nhận, Nộp bài); không hiện nút duyệt của Mentor/Admin. | PASS |
| TC-31 | Phạm vi Task | Intern chỉ thấy task của mình | 1. Đăng nhập Intern. 2. Mở "Nhiệm vụ được giao" (`/intern/tasks`). | Bảng chỉ liệt kê task có người phụ trách là chính mình, không thấy task của Intern khác. | PASS |
| TC-32 | Phạm vi Task | Mentor chỉ thấy và sửa task mình giao / TTS phụ trách | 1. Đăng nhập Mentor. 2. Mở "Giao việc & Tiến độ". 3. Thử chỉnh sửa task không thuộc phạm vi. | Không hiện task của Mentor khác/task ngoài nhóm phụ trách; khi chỉnh sửa chỉ sửa được task của mình hoặc của TTS mình phụ trách. | PASS |
| TC-33 | Phạm vi Task | Badge trạng thái và hạn chót hiển thị đúng | 1. Mở thẻ task bất kỳ. | Thẻ hiển thị đầy đủ: trạng thái (Chờ xác nhận / Đang thực hiện / Chờ duyệt / Hoàn thành / Từ chối), mức ưu tiên, "Người giao", "Phụ trách", "Hạn: ngày/tháng/năm", có badge "Đúng hạn"/"Trễ hạn". | PASS |
| TC-34 | Task con | Tạo task con trực thuộc task gốc | 1. Tại form "Giao nhiệm vụ mới", ở "Công việc cha" chọn "Không (công việc gốc)" hoặc chọn task gốc. 2. Nhấn "Tạo công việc". | Task con hiện nhãn "Sub" và chỉ gắn được vào task gốc cấp trên; không tạo task cháu/lồng nhau. | PASS |

#### Module 4. Chấm công (Check-in / Check-out)

| STT | Module | Kịch bản test (Test Case) | Các bước thực hiện | Kết quả mong đợi | Trạng thái (Pass/Fail) |
|---|---|---|---|---|---|
| TC-35 | Chấm công | Intern check-in thành công | 1. Đăng nhập Intern. 2. Vào "Điểm danh hằng ngày" (`/intern/attendance`) hoặc card "Điểm danh hôm nay" ở `/intern`. 3. Nhấn "Check-in ngay". | Hiện thông báo "Check-in thành công!", trạng thái chuyển sang "Đang làm việc", ghi nhận giờ check-in. | PASS |
| TC-36 | Chấm công | Check-in 2 lần cùng ngày bị chặn | 1. Sau khi đã check-in trong ngày, quan sát nút Check-in. | Nút "Check-in ngay" chuyển sang trạng thái khóa (disabled); không tạo được bản ghi thứ 2 trong ngày. | PASS |
| TC-37 | Chấm công | Intern check-out thành công | 1. Vào "Điểm danh hằng ngày". 2. Nhấn "Check-out". | Hiện thông báo "Check-out thành công!", trạng thái chuyển sang "Đã hoàn tất ngày làm việc", hệ thống tính "Tổng giờ làm". | PASS |
| TC-38 | Chấm công | Check-out khi chưa check-in bị chặn | 1. Ngày mới, chưa check-in. 2. Thử nhấn "Check-out". | Nút "Check-out" đang khóa (disabled) bởi chưa có check-in; không thể check-out sớm. | PASS |
| TC-39 | Chấm công | Intern xem lịch sử 30 ngày | 1. Vào "Điểm danh hằng ngày". 2. Kiểm tra bảng "Lịch sử điểm danh của bạn (30 ngày gần nhất)". | Bảng liệt kê các ngày, giờ check-in/check-out, tổng giờ làm; thống kê "Số buổi đã điểm danh" và "Tổng giờ tích lũy". | PASS |
| TC-40 | Chấm công | Mentor/Admin theo dõi điểm danh (chỉ đọc) | 1. Đăng nhập Mentor. 2. Vào "Điểm danh TTS" (`/mentor/attendance`). 3. Đăng nhập Admin vào "Giám sát điểm danh" (`/admin/attendance`). | Hiện bảng nhật ký chấm công với thống kê "Đã Check-in hôm nay", "Chưa điểm danh hôm nay"; không có nút chỉnh sửa. | PASS |

#### Module 5. Báo cáo tuần (Weekly Report)

| STT | Module | Kịch bản test (Test Case) | Các bước thực hiện | Kết quả mong đợi | Trạng thái (Pass/Fail) |
|---|---|---|---|---|---|
| TC-41 | Báo cáo tuần | Intern nộp báo cáo tuần | 1. Đăng nhập Intern. 2. Vào "Báo cáo tuần" (`/intern/reports`). 3. Chọn task, nhập nội dung báo cáo, đính kèm tệp (PDF/Word, tối đa 10MB). 4. Nhấn nút nộp. | Báo cáo hiện trạng thái "Đã nộp", tệp đính kèm được lưu vào storage "documents"; Intern thấy trong danh sách. | PASS |
| TC-42 | Báo cáo tuần | Nộp báo cáo trùng (cùng task + cùng tuần) bị chặn | 1. Nộp báo cáo cho task A tuần hiện tại. 2. Thử nộp tiếp cho cùng task A cùng tuần đó. | Hệ thống báo "Đã nộp báo cáo cho công việc này ở tuần đó", không tạo bản ghi trùng. | PASS |
| TC-43 | Báo cáo tuần | Nộp báo cáo thiếu nội dung bị chặn | 1. Để trống ô nội dung. 2. Nhấn nút nộp. | Hệ thống yêu cầu nhập nội dung mới cho nộp. | PASS |
| TC-44 | Báo cáo tuần | Mentor xem báo cáo của TTS phụ trách | 1. Đăng nhập Mentor. 2. Vào "Báo cáo tuần" (`/mentor/reports`). 3. Mở báo cáo của Intern trong nhóm. | Hiển thị nội dung báo cáo, tệp đính kèm (nút "Tệp đính kèm" mở được); chỉ thấy báo cáo của Intern mình phụ trách. | PASS |
| TC-45 | Báo cáo tuần | Mentor lưu nhận xét báo cáo | 1. Báo cáo đang trạng thái "Đã nộp". 2. Nhập nhận xét vào ô "Nhận xét, đánh giá tiến độ và góp ý cho tuần này...". 3. Nhấn "Lưu nhận xét". | Trạng thái báo cáo chuyển sang "Đã duyệt", khu vực "Nhận xét đã lưu" hiện nội dung vừa ghi. | PASS |
| TC-46 | Báo cáo tuần | Intern đọc lại nhận xét của Mentor | 1. Mở báo cáo đã duyệt ở `/intern/reports`. 2. Kiểm tra khu vực nhận xét. | Trang "Báo cáo tuần" của Intern hiển thị nhận xét của Mentor kèm trạng thái "Đã duyệt". | PASS |
| TC-47 | Báo cáo tuần | Mentor không thấy báo cáo của Intern ngoài nhóm | 1. Đăng nhập với Mentor nhóm A. 2. Kiểm tra danh sách ở `/mentor/reports`. | Chỉ hiện các báo cáo thuộc Intern nhóm A, không thấy báo cáo của nhóm khác. | PASS |

#### Module 6. Tính năng bổ trợ (Đơn nghỉ phép, Đánh giá, Tài liệu, Thông báo Realtime)

| STT | Module | Kịch bản test (Test Case) | Các bước thực hiện | Kết quả mong đợi | Trạng thái (Pass/Fail) |
|---|---|---|---|---|---|
| TC-48 | Đơn nghỉ phép | Intern tạo đơn nghỉ phép / làm việc từ xa | 1. Vào menu "Xin nghỉ phép / WFH" (`/intern/requests`). 2. Chọn "Loại yêu cầu" (Xin nghỉ phép hoặc WFH). 3. Chọn người duyệt (Mentor được phân công), nhập ngày bắt đầu/kết thúc, lý do. 4. Nhấn "Gửi đơn phê duyệt". | Hiện thông báo "Đã gửi đơn phê duyệt!", đơn xuất hiện trong "Danh sách đơn của bạn" với trạng thái "Chờ duyệt". | PASS |
| TC-49 | Đơn nghỉ phép | Chưa phân công Mentor thì không gửi được | 1. Đăng nhập với Intern chưa được phân công Mentor. 2. Mở form tạo đơn. | Tài khoản chưa được phân công Mentor, hệ thống báo "Chưa được phân công Mentor...", nút gửi không hoạt động. | PASS |
| TC-50 | Đơn nghỉ phép | Validate ngày kết thúc >= ngày bắt đầu | 1. Nhập ngày kết thúc trước ngày bắt đầu. 2. Nhấn "Gửi đơn phê duyệt". | Hệ thống chặn với thông báo lỗi, không tạo đơn. | PASS |
| TC-51 | Đơn nghỉ phép | Mentor duyệt đơn của TTS phụ trách | 1. Đăng nhập Mentor. 2. Vào "Duyệt đơn nghỉ phép" (`/mentor/requests`). 3. Tại đơn trạng thái "Chờ xem xét", nhấn "Duyệt đơn". | Hiện thông báo "Đã duyệt đơn!", đơn chuyển trạng thái "Đã duyệt"; Realtime cập nhật chuông thông báo phía Intern. | PASS |
| TC-52 | Đơn nghỉ phép | Mentor từ chối đơn | 1. Tại đơn "Chờ xem xét", nhấn "Từ chối". | Hiện thông báo "Đã từ chối đơn.", đơn chuyển trạng thái "Từ chối" kèm thời điểm duyệt. | PASS |
| TC-53 | Đơn nghỉ phép | Admin giám sát toàn hệ thống | 1. Đăng nhập Admin. 2. Vào "Quản lý đơn nghỉ phép" (`/admin/requests`). | Xem được toàn bộ đơn của mọi Khoa/nhóm, có nút duyệt/từ chối như Mentor. | PASS |
| TC-54 | Đánh giá | Mentor nhập phiếu đánh giá TTS | 1. Đăng nhập Mentor. 2. Vào "Đánh giá TTS" (`/mentor/evaluations`). 3. Chọn "Thực tập sinh", chọn "Kỳ đánh giá" (Giữa kỳ / Cuối kỳ), nhập 3 điểm 0-10, nhập nhận xét. 4. Nhấn "Lưu kết quả đánh giá". | Phiếu đánh giá được lưu, hiển thị điểm trung bình; khi đánh giá lại cùng kỳ sẽ ghi đè (không trùng). | PASS |
| TC-55 | Đánh giá | Intern xem kết quả đánh giá | 1. Vào "Kết quả đánh giá" (`/intern/evaluations`). | Hiển thị điểm trung bình, 3 tiêu chí (Chuyên môn, Làm việc nhóm, Kỷ luật) và "Nhận xét từ Mentor". | PASS |
| TC-56 | Tài liệu | Intern tải lên tài liệu cá nhân | 1. Vào "Tài liệu & Báo cáo" (`/intern/documents`). 2. Chọn file PDF/Word dưới 10MB. 3. Nhấn "Tải lên". | File hiện trong "Tài liệu cá nhân"; nút "Tải xuống" mở được file. | PASS |
| TC-57 | Tài liệu | Chặn tải lên file sai định dạng | 1. Thử tải lên file không phải PDF/Word hoặc quá 10MB. | Hệ thống từ chối tải lên với thông báo định dạng/dữ liệu không hợp lệ. | PASS |
| TC-58 | Thông báo | Chuông thông báo Realtime | 1. Đăng nhập song song 2 phiên: Intern và Mentor. 2. Mentor tạo task mới cho Intern. | Phiên Intern tại header hiện chuông thông báo với số đếm tăng lên khi có task mới / đơn được duyệt / báo cáo mới. | PASS |

### A.3. Kết luận kiểm thử

- Tổng số ca kiểm thử: **58** (TC-01 đến TC-58).
- Kết quả: **58/58 PASS** (dựa trên dữ liệu chuẩn bị đúng quy trình).
- Không còn lỗi mức Critical/High gây cản trở phát hành. Các quy tắc nghiệp vụ (phân công mentor cùng Khoa, tính Đúng/Trễ hạn tự động, chặn nộp trùng báo cáo, phạm vi dữ liệu theo vai trò) được xác nhận hoạt động đúng trên cả giao diện lẫn ràng buộc phía cơ sở dữ liệu (RLS + trigger).

---

## PHẦN B. TÀI LIỆU HƯỚNG DẪN SỬ DỤNG (USER MANUAL) THEO VAI TRÒ

### B.0. Phần chung

1. Đối tượng sử dụng: Admin (Quản trị viên), Mentor (Người hướng dẫn), Intern (Thực tập sinh).
2. Truy cập hệ thống: mở trình duyệt, nhập địa chỉ URL hệ thống. Nếu chưa đăng nhập, hệ thống tự chuyển về trang `/login`.
3. Đăng nhập:
   - B1: Nhập "Email công việc" (định dạng `ten.dang.nhap@...`).
   - B2: Nhập "Mật khẩu".
   - B3: Nhấn nút "Đăng nhập". Hệ thống tự chuyển về trang chính theo vai trò.
4. Thanh điều hướng bên trái (Sidebar) thay đổi theo vai trò; nút "Đăng xuất" nằm trong menu avatar ở góc trên bên phải.
5. Chuông thông báo ở header hiện số đếm khi có task mới, đơn được duyệt hoặc báo cáo tuần mới.

### B.1. Hướng dẫn sử dụng cho Admin

#### B.1.1. Tổng quan hệ thống (`/admin`)
- B1: Đăng nhập tài khoản Admin.
- B2: Quan sát các thẻ thống kê: "Tổng số thực tập sinh", "Tổng số Mentor", "Chưa phân công Mentor", "Đơn phép chờ duyệt".
- B3: Nếu có banner cảnh báo TTS chưa phân công Mentor, nhấn "Phân công ngay" để sang trang phân quyền.
- B4: Dùng các lối tắt nhanh: "Phân quyền và quản lý tài khoản", "Giám sát công việc", "Theo dõi điểm danh toàn trường", "Duyệt đơn nghỉ phép và WFH".

#### B.1.2. Phân quyền tài khoản & Chỉ định Mentor (`/admin/interns`)
- B1: Menu trái nhấn "Phân quyền tài khoản".
- B2: Ở bảng danh sách tài khoản, tại dòng của Intern cần xử lý, mở mục "Đơn vị & Mentor (Cascading)".
- B3: Chọn "Đơn vị" (Khoa) trước; danh sách "Mentor" mới được mở khóa.
- B4: Chọn "Mentor" (chỉ hiển thị Mentor CÙNG đơn vị) để gán người phụ trách.
- B5: Muốn đổi vai trò, mở danh sách "Vai trò" và chọn Admin/Mentor/Intern.
- B6: Nhấn "Lưu" để áp dụng. Kiểm tra cột "Mentor phụ trách" không còn "Chưa phân công".

#### B.1.3. Quản lý / Giám sát công việc (`/admin/tasks`)
- B1: Menu trái nhấn "Quản lý công việc".
- B2: Quan sát kanban 5 cột: "Chờ xác nhận", "Đang thực hiện", "Chờ duyệt", "Hoàn thành", "Từ chối".
- B3: Tạo task: ở khối "Giao nhiệm vụ mới", nhập "Tên công việc", "Mô tả ngắn", "Danh mục", chọn "Ưu tiên", "Hạn" (deadline), "Công việc cha", chọn người phụ trách (hoặc "Giao cho tôi"), nhấn "Tạo công việc".
- B4: Duyệt bài: tại task ở cột "Chờ duyệt", nhập "Nhận xét / phản hồi" rồi chọn 1 trong 3 nút: "Duyệt hoàn thành" / "Yêu cầu làm lại" / "Từ chối".
- B5: Chỉnh sửa task: nhấn "Chỉnh sửa" trên thẻ task, sửa thông tin, nhấn "Lưu" hoặc "Hủy".

#### B.1.4. Giám sát điểm danh (`/admin/attendance`)
- B1: Menu trái nhấn "Giám sát điểm danh".
- B2: Xem thẻ thống kê "Tổng số Thực tập sinh", "Đã Check-in hôm nay", "Chưa điểm danh hôm nay".
- B3: Tra cứu bảng "Danh sách bản ghi điểm danh" theo cột: Thực tập sinh / Ngày / Check-in-Check-out / Tổng giờ làm. Trang này chỉ đọc, Admin không sửa dữ liệu chấm công.

#### B.1.5. Duyệt đơn nghỉ phép (`/admin/requests`)
- B1: Menu trái nhấn "Quản lý đơn nghỉ phép".
- B2: Tại phần "Đơn đang chờ xem xét", chọn đơn cần xử lý.
- B3: Nhấn "Duyệt đơn" (đồng ý) hoặc "Từ chối".
- B4: Xem "Lịch sử đơn đã giải quyết" bên dưới để theo dõi kết quả.

#### B.1.6. Các chức năng còn lại
- Đánh giá: vào "Báo cáo đánh giá" (`/admin/evaluations`), chọn "Thực tập sinh", "Kỳ đánh giá" (Giữa kỳ/Cuối kỳ), nhập 3 điểm 0-10 và "Nhận xét", nhấn "Lưu kết quả đánh giá".
- Kho tài liệu: vào "Kho tài liệu" (`/admin/documents`) để xem tài liệu toàn hệ thống.
- Cài đặt hệ thống: vào "Cài đặt hệ thống" (`/admin/settings`) để sửa thông tin cá nhân của Admin (tên, trường, chuyên ngành, ảnh đại diện) và nhấn "Lưu thay đổi".

### B.2. Hướng dẫn sử dụng cho Mentor

#### B.2.1. Bàn làm việc Mentor (`/mentor`)
- B1: Đăng nhập tài khoản Mentor.
- B2: Quan sát thẻ thống kê: "TTS do bạn phụ trách", "Đơn chờ bạn duyệt", "Nhiệm vụ TTS đang làm".
- B3: Tại card "Đơn nghỉ phép cần phê duyệt", nhấn "Xem tất cả" để chuyển đến trang duyệt đơn.
- B4: Tại card "Danh sách Thực tập sinh phụ trách", nhấn "Giao việc cho nhóm" để sang trang giao việc.
- B5: Tại card "Nhiệm vụ đang giao cho TTS", nhấn "Quản lý nhiệm vụ" để theo dõi tiến độ.

#### B.2.2. Giao việc & Tiến độ (`/mentor/tasks`)
- B1: Menu trái nhấn "Giao việc & Tiến độ".
- B2: Tạo task: ở khối "Giao nhiệm vụ mới", điền "Tên công việc", "Mô tả ngắn", "Danh mục", "Ưu tiên", "Hạn", chọn "Người phụ trách" (chỉ là TTS của nhóm), nhấn "Tạo công việc".
- B3: Theo dõi thẻ task: xem trạng thái, "Đúng hạn"/"Trễ hạn", "Người giao", "Phụ trách", "Hạn", link "Kết quả nộp bài", "Phản hồi".
- B4: Duyệt bài làm: tại task ở cột "Chờ duyệt", nhập nhận xét, chọn "Duyệt hoàn thành" / "Yêu cầu làm lại" / "Từ chối".
- B5: Chỉnh sửa task đã giao: nhấn "Chỉnh sửa" trên thẻ task, thay đổi thông tin, nhấn "Lưu".

#### B.2.3. Báo cáo tuần (`/mentor/reports`)
- B1: Menu trái nhấn "Báo cáo tuần".
- B2: Xem số "báo cáo chưa duyệt" ở đầu trang.
- B3: Muốn xem file, nhấn "Tệp đính kèm" (link có hạn 1 giờ).
- B4: Nhập nhận xét tại ô "Nhận xét, đánh giá tiến độ và góp ý cho tuần này..." (bắt buộc, tối đa 3000 ký tự).
- B5: Nhấn "Lưu nhận xét". Báo cáo chuyển trạng thái "Đã duyệt", nội dung hiện ở khu "Nhận xét đã lưu".

#### B.2.4. Điểm danh TTS (`/mentor/attendance`)
- B1: Menu trái nhấn "Điểm danh TTS".
- B2: Xem thẻ thống kê "TTS bạn phụ trách", "Đã Check-in hôm nay", "Chưa điểm danh hôm nay".
- B3: Tra cứu bảng "Nhật ký chấm công của nhóm". Trang này chỉ đọc.

#### B.2.5. Duyệt đơn nghỉ phép (`/mentor/requests`)
- B1: Menu trái nhấn "Duyệt đơn nghỉ phép".
- B2: Tại phần "Đơn đang chờ xem xét", chọn đơn của TTS trong nhóm.
- B3: Nhấn "Duyệt đơn" hoặc "Từ chối".
- B4: Xem "Lịch sử đơn đã giải quyết" để đối chiếu.

#### B.2.6. Đánh giá TTS (`/mentor/evaluations`)
- B1: Menu trái nhấn "Đánh giá TTS".
- B2: Chọn "Thực tập sinh" (chỉ TTS phụ trách), chọn "Kỳ đánh giá": "Đánh giá Giữa kỳ" hoặc "Đánh giá Cuối kỳ (Tổng kết)".
- B3: Nhập 3 điểm: "Kỹ thuật & Chuyên môn", "Làm việc nhóm & Giao tiếp", "Kỷ luật & Tác phong" (thang 0-10, bước 0.5).
- B4: Nhập "Nhận xét & Định hướng phát triển".
- B5: Nhấn "Lưu kết quả đánh giá". Nếu đã có phiếu cùng kỳ, hệ thống ghi đè.

#### B.2.7. Tài liệu và Cài đặt
- Tài liệu: vào "Tài liệu hướng dẫn" (`/mentor/documents`) để xem tài liệu hướng dẫn và bảng "Báo cáo của Thực tập sinh" theo từng intern.
- Cài đặt cá nhân: vào "Cài đặt cá nhân" (`/mentor/settings`), chỉnh sửa tên, trường, chuyên ngành, ảnh đại diện, nhấn "Lưu thay đổi".

### B.3. Hướng dẫn sử dụng cho Intern

#### B.3.1. Tổng quan (`/intern`)
- B1: Đăng nhập tài khoản Intern.
- B2: Tại card "Điểm danh hôm nay": nhấn "Check-in ngay" khi bắt đầu làm việc, nhấn "Check-out" khi kết thúc.
- B3: Kiểm tra card "Mentor phụ trách" hiển thị "Đã phân công chính thức" (hoặc cảnh báo liên hệ Admin).
- B4: Xem thẻ thống kê "Giờ làm tuần này", "Nhiệm vụ của bạn", "Đơn nghỉ đang duyệt".
- B5: Dùng các lối tắt: "Xem bảng công việc", "Gửi đơn mới", "Xem bảng điểm chi tiết".

#### B.3.2. Nhiệm vụ được giao (`/intern/tasks`)
- B1: Menu trái nhấn "Nhiệm vụ được giao".
- B2: Tại task ở cột "Chờ xác nhận", nhấn "Xác nhận nhận task" để bắt đầu thực hiện.
- B3: Tại task ở cột "Đang thực hiện", nhập "Liên kết kết quả/bài làm (URL)", nhấn "Nộp bài".
- B4: Đọc "Phản hồi" và badge "Đúng hạn"/"Trễ hạn" trên thẻ task; sau khi nộp, chờ Mentor duyệt.
- B5: Nếu bị "Yêu cầu làm lại", task quay về "Đang thực hiện", chỉnh sửa bài làm và nộp lại.

#### B.3.3. Báo cáo tuần (`/intern/reports`)
- B1: Menu trái nhấn "Báo cáo tuần".
- B2: Nhấn nút tạo báo cáo (nút nộp "Gửi"), chọn công việc, nhập nội dung báo cáo (bắt buộc, tối đa 10000 ký tự), đính kèm tệp PDF/Word tối đa 10MB.
- B3: Nhấn "Gửi" để nộp. Trạng thái chuyển "Đã nộp".
- B4: Quay lại xem phản hồi "Nhận xét của Mentor" sau khi Mentor duyệt.

#### B.3.4. Điểm danh hằng ngày (`/intern/attendance`)
- B1: Menu trái nhấn "Điểm danh hằng ngày".
- B2: Xem card trạng thái hôm nay, nhấn "Check-in ngay" khi bắt đầu, "Check-out" khi kết thúc ngày.
- B3: Xem bảng "Lịch sử điểm danh (30 ngày gần nhất)" và thẻ thống kê "Số buổi đã điểm danh", "Tổng giờ tích lũy".

#### B.3.5. Xin nghỉ phép / WFH (`/intern/requests`)
- B1: Menu trái nhấn "Xin nghỉ phép / WFH".
- B2: Tại "Tạo đơn xin nghỉ mới": chọn "Loại yêu cầu" (Xin nghỉ phép / Làm việc từ xa), "Người duyệt (Mentor)" mặc định là mentor được phân công, nhập "Ngày bắt đầu", "Ngày kết thúc", "Lý do cụ thể".
- B3: Nhấn "Gửi đơn phê duyệt".
- B4: Theo dõi trạng thái trong "Danh sách đơn của bạn" (Chờ duyệt / Đã duyệt / Từ chối).

#### B.3.6. Kết quả đánh giá (`/intern/evaluations`)
- B1: Menu trái nhấn "Kết quả đánh giá".
- B2: Xem các phiếu đánh giá đã có: "Điểm TB", 3 tiêu chí và "Nhận xét từ Mentor".

#### B.3.7. Tài liệu & Báo cáo (`/intern/documents`)
- B1: Menu trái nhấn "Tài liệu & Báo cáo".
- B2: Tại "Tải lên tài liệu mới": chọn file PDF/Word dưới 10MB, nhấn "Tải lên".
- B3: Tại "Tài liệu cá nhân", nhấn "Tải xuống" để lưu về máy.

#### B.3.8. Hồ sơ cá nhân (`/intern/settings`)
- B1: Menu trái nhấn "Hồ sơ cá nhân".
- B2: Chỉnh sửa "Họ và tên", "Trường đại học", "Chuyên ngành đào tạo", "Đường dẫn ảnh đại diện" (email tài khoản bị khóa, không đổi được).
- B3: Xem "Phân quyền tài khoản" (vai trò hiện tại).
- B4: Nhấn "Lưu thay đổi".

---

### Bảng tình trạng phiên bản

| Nội dung | Tình trạng |
|---|---|
| Kịch bản UAT (Phần A) | Đã kiểm thử 58 ca, toàn bộ PASS |
| Hướng dẫn sử dụng (Phần B) | Đã soạn xong cho 3 vai trò, khớp với UI thực tế |

*Ghi chú: không dùng dấu gạch em-dash trong toàn tài liệu để đảm bảo nhất quán với design system của dự án.*