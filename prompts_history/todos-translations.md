Я собрал все ключи, которые реально используются в проекте через t('...'). Вот итоговый шаблон для пополнения переводов (добавь их во все Paraglide-js json-файлы):
Полный список ключей для перевода (уникальные):


add_product
add_shop
active
admin
all_products
all_roles
all_statuses
available
block
boss
bulk_action
cancel
cart
cart_empty
change_status_to
checkout
choose_language
client
clear_cart
comment
confirm_delete_order
confirm_delete_product
confirm_delete_review
confirm_delete_shop
confirm_delete_user
courier
created_at
delete
delete_product
delete_shop
edit_order
edit_product
edit_review
edit_shop
edit_user
error_loading_orders
error_loading_products
error_loading_reviews
error_loading_shops
error_loading_users
for
inactive
is_active
main_showcase_title
manager
menu
no_orders
no_products
no_shops
not_available
order
order_created
order_details
order_error
order_items
order_load_error
order_not_found
order_paid_stub
order_pay_error
order_status
order_status_changed
order_status_change_error
order_status_history
order_status_history_empty
order_status_history_error
order_success
order_total
orders
orders_title
owner
pay_stub
price
product_name
products
products_title
rating
remove
reviews
reviews_title
role
search
seller
shop
shop_name
shop_not_found
shop_products_title
shops
shops_list_title
shops_title
special_dish
status
status_assigned
status_cancelled
status_completed
status_created
status_delivered
status_in_progress
status_paid
stub
total
user
users
users_title
username
vip


Что делать дальше
Проверь, что все эти ключи есть в каждом из файлов:
messages/ru.json
messages/en.json
messages/tj.json


Я нашёл все вызовы t('ключ') и готов заменить их на поимённые функции из Paraglide, а также исправить импорты.
Что будет сделано:
Удалю импорт t из @inlang/paraglide-js
Импортирую нужные функции из $lib/paraglide/messages.js
Заменю все вызовы t('ключ') на вызовы соответствующих функций, например:
t('orders_title') → orders_title()



Что нужно сделать для полной работоспособности:
Обновить все переходы и ссылки:
Все переходы вида goto('/products') → goto('/' + params.lang + '/products')
Все <a href="/products"> → <a href="/{params.lang}/products">
Аналогично для всех остальных роутов.
В каждом Svelte-файле, где есть переходы, получить params.lang:
В layout: export let params;
В page: export let params; (или через load-функцию)
Обновить редиректы и логику выбора языка.


Я продолжаю массовое обновление всех переходов и ссылок на фронте SvelteKit, чтобы они корректно работали с языковым префиксом (/ru, /en и т.д.) согласно новой мультиязычной структуре.
План действий:
Найти все внутренние переходы (href, goto, navigate, формы, ссылки) и обновить их на формат с /${lang}/....
Проверить, что все динамические параметры получают lang из URL или props.
Обновить все формы и редиректы, чтобы они учитывали текущий язык.
Проверить, что навигация и хлебные крошки (breadcrumbs) также используют lang.
Убедиться, что нет "жёстко" прописанных путей без языкового префикса.
Следующие шаги:
Найду все места в проекте, где используются переходы и ссылки.
Обновлю их на работу с параметром lang.
Проверю корректность работы навигации.