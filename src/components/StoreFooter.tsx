import React from 'react';
import { Link } from 'react-router-dom';
import footerConfig from '../config/footer.json';

const footer = footerConfig.footer;

export const StoreFooter: React.FC = () => {
  const renderLinks = (links: { label: string; url: string }[]) =>
    links.map((link) => (
      <Link key={link.url} to={link.url} className={footer.customer_support.linkClassName}>
        <span>{link.label}</span>
        <span aria-hidden="true">→</span>
      </Link>
    ));

  return (
    <footer className={footer.containerClassName}>
      <div className={footer.contentClassName}>
        <section>
          <h2 className={footer.brand.className}>{footer.brand.name}</h2>
          <p className={footer.brand.descriptionClassName}>{footer.brand.description}</p>
        </section>

        {footer.newsletter.enabled && (
          <section aria-label={footer.newsletter.title}>
            <h3 className="text-sm font-semibold text-neutral-900">{footer.newsletter.title}</h3>
            <p className="mt-2 text-sm text-neutral-500">{footer.newsletter.description}</p>
          </section>
        )}

        <section className={footer.customer_support.sectionClassName}>
          <h3 className={footer.customer_support.titleClassName}>{footer.customer_support.title}</h3>
          <div className={footer.customer_support.linksClassName}>
            {renderLinks(footer.customer_support.links)}
          </div>
        </section>

        <section className={footer.information_and_policies.sectionClassName}>
          <h3 className={footer.information_and_policies.titleClassName}>{footer.information_and_policies.title}</h3>
          <div className={footer.information_and_policies.linksClassName}>
            {renderLinks(footer.information_and_policies.links)}
          </div>
        </section>

        <section className={footer.payment_information.containerClassName}>
          <h3 className={footer.payment_information.titleClassName}>{footer.payment_information.title}</h3>
          <p className={footer.payment_information.descriptionClassName}>{footer.payment_information.description}</p>
          <p className={footer.payment_information.provider.className}>{footer.payment_information.provider.name}</p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">{footer.payment_information.provider.description}</p>
          <span className={footer.payment_information.currencyClassName}>
            {footer.payment_information.currency} · {footer.payment_information.currency_display}
          </span>
        </section>

        <section className={footer.business_information.containerClassName}>
          <h3 className={footer.business_information.businessNameClassName}>{footer.business_information.title}</h3>
          <p className={footer.business_information.businessNameClassName}>{footer.business_information.business_name}</p>
          {footer.business_information.contacts.map((contact) => (
            <div key={contact.label}>
              <p className={footer.business_information.labelClassName}>{contact.label}</p>
              {contact.url ? (
                <a href={contact.url} className={contact.className}>{contact.value}</a>
              ) : (
                <p className={contact.className}>{contact.value}</p>
              )}
            </div>
          ))}
        </section>

        <div className={footer.copyright.containerClassName}>
          <p className={footer.copyright.className}>{footer.copyright.text}</p>
        </div>
      </div>
    </footer>
  );
};
