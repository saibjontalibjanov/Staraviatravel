import { User } from '@strapi/icons'

const permissions = [{ action: 'plugin::content-manager.explorer.read', subject: 'api::lead.lead' }]

export default {
  config: { locales: ['ru'] },
  register(app) {
    app.addMenuLink({
      to: 'plugins/leads',
      icon: User,
      intlLabel: { id: 'staravia.leads.menu', defaultMessage: 'Leads' },
      permissions,
      Component: () => import('./components/LeadsPage'),
    })
    app.addMenuLink({
      to: 'plugins/ticket-search',
      icon: User,
      intlLabel: { id: 'staravia.ticket-search.menu', defaultMessage: 'Ticket Search' },
      permissions: [{ action: 'api::ticket-search.search' }],
      Component: () => import('./components/ticket-search/TicketSearchPage'),
    })
    app.addMenuLink({
      to: 'plugins/telegram',
      icon: User,
      intlLabel: { id: 'staravia.telegram.menu', defaultMessage: 'Telegram' },
      permissions: [{ action: 'api::telegram.read' }],
      Component: () => import('./components/telegram/TelegramPage'),
    })
    app.router.addRoute({
      path: ':clientReference',
      lazy: () => import('./components/LeadsPage').then(module => ({ Component: module.default })),
    })
    app.widgets.register(widgets => [{
      id: 'leads',
      icon: User,
      title: { id: 'staravia.leads.widget', defaultMessage: 'Leads' },
      permissions,
      component: () => import('./components/LeadsWidget').then(module => module.default),
      link: { label: { id: 'staravia.leads.all', defaultMessage: 'View all leads' }, href: '/plugins/leads' },
    }, ...widgets])
  },
}
